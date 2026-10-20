// src/features/solar-mapper/store/useSolarMapperStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GeoPoint,
  LocationIrradianceProfile,
  PanelOrientation,
  PshDesignBasis,
  RoofMappingSummary,
  RoofPolygonSection,
} from '../types/solarMapper';
import {
  calculateEdgeLengthsMeters,
  calculateSlopedRoofAreaSqm,
  calculateSphericalPolygonAreaSqm,
  hasSelfIntersection,
  projectVerticesToLocalMeters,
  unprojectLocalMetersToGeo,
} from '../utils/geodesicMath';
import { calculateOrientationYieldFactor } from '../utils/solarPhysics';
import { calculatePanelPacking } from '../utils/panelPackingEngine';
import { DEFAULT_PRESET } from '../services/regionalPresets';
import { createProfileFromPreset } from '../services/nasaPowerApi';

export interface SolarMapperState {
  coordinates: GeoPoint & { locationName: string };
  zoom: number;
  designBasis: PshDesignBasis;
  panelWattage: 550 | 580 | 600;
  roofSections: RoofPolygonSection[];
  activeSectionId: string | null;
  isDrawingMode: boolean;
  viewMode: '2d_satellite' | '3d_preview';
  sunHour: number; // 6.0 to 18.0 (default 12.0)
  irradianceProfile: LocationIrradianceProfile;
  isLoadingIrradiance: boolean;

  // Actions
  setCoordinates: (coords: GeoPoint, name?: string) => void;
  setZoom: (zoom: number) => void;
  setDesignBasis: (basis: PshDesignBasis) => void;
  setPanelWattage: (wattage: 550 | 580 | 600) => void;
  setViewMode: (mode: '2d_satellite' | '3d_preview') => void;
  setIsDrawingMode: (isDrawing: boolean) => void;
  setSunHour: (hour: number) => void;
  setIrradianceProfile: (profile: LocationIrradianceProfile) => void;
  setIsLoadingIrradiance: (loading: boolean) => void;

  // Polygon actions
  addRoofSection: (name?: string) => string;
  removeRoofSection: (id: string) => void;
  setActiveSectionId: (id: string | null) => void;
  updateRoofSectionConfig: (id: string, updates: Partial<RoofPolygonSection>) => void;
  addVertexToActiveSection: (pt: GeoPoint) => void;
  updateVertexPosition: (sectionId: string, index: number, pt: GeoPoint) => void;
  removeVertex: (sectionId: string, index: number) => void;
  undoLastVertex: () => void;
  clearActivePolygon: () => void;
  loadDemoRoofPolygon: () => void;

  // Computed getters
  getSummary: () => RoofMappingSummary;
  getSelectedPsh: () => number;
}

/**
 * Recomputes all geometric and engineering metrics for a single section.
 */
function recomputeSection(
  section: RoofPolygonSection,
  effectivePsh: number
): RoofPolygonSection {
  const flatAreaSqm = calculateSphericalPolygonAreaSqm(section.vertices);
  const slopedAreaSqm = calculateSlopedRoofAreaSqm(flatAreaSqm, section.pitchDeg);
  const edgeLengthsMeters = calculateEdgeLengthsMeters(section.vertices);
  const hasBowtieCross = hasSelfIntersection(section.vertices);
  const localVertices = projectVerticesToLocalMeters(section.vertices);

  const orientationYieldFactor = calculateOrientationYieldFactor(
    section.pitchDeg,
    section.azimuthDeg
  );

  const packing = calculatePanelPacking({
    localVertices,
    slopedAreaSqm,
    pitchDeg: section.pitchDeg,
    setbackRatio: section.setbackRatio,
    panelWattage: section.panelWattage,
    orientationPreference: section.panelOrientation,
  });

  // Daily energy in kWh = (kWp * effectivePsh * (1 - shading))
  const shadingFactor = Math.max(0, 1 - section.shadingLossPercent / 100);
  const estimatedDailyKwh =
    Math.round(packing.totalArrayKwp * effectivePsh * shadingFactor * 10) / 10;

  return {
    ...section,
    flatAreaSqm,
    slopedAreaSqm,
    usableAreaSqm: packing.usableAreaSqm,
    edgeLengthsMeters,
    maxPanelsPortrait: packing.maxPanelsPortrait,
    maxPanelsLandscape: packing.maxPanelsLandscape,
    recommendedMaxPanels: packing.recommendedMaxPanels,
    placedPanels: packing.placedPanels,
    maxArrayKwp: packing.totalArrayKwp,
    orientationYieldFactor,
    estimatedDailyKwh,
    hasBowtieCross,
  };
}

const initialProfile = createProfileFromPreset(DEFAULT_PRESET);

export const useSolarMapperStore = create<SolarMapperState>()(
  persist(
    (set, get) => ({
      coordinates: {
        lat: DEFAULT_PRESET.coordinates.lat,
        lng: DEFAULT_PRESET.coordinates.lng,
        locationName: `${DEFAULT_PRESET.name}, ${DEFAULT_PRESET.country}`,
      },
      zoom: 19,
      designBasis: 'annual_avg',
      panelWattage: 580,
      roofSections: [],
      activeSectionId: null,
      isDrawingMode: false,
      viewMode: '2d_satellite',
      sunHour: 12.0,
      irradianceProfile: initialProfile,
      isLoadingIrradiance: false,

      setCoordinates: (coords, name) => {
        set((state) => ({
          coordinates: {
            lat: coords.lat,
            lng: coords.lng,
            locationName: name || state.coordinates.locationName,
          },
        }));
      },

      setZoom: (zoom) => set({ zoom: Math.min(21, Math.max(16, zoom)) }),
      setDesignBasis: (designBasis) => set({ designBasis }),
      setPanelWattage: (panelWattage) => {
        set((state) => {
          const effectivePsh = get().getSelectedPsh();
          return {
            panelWattage,
            roofSections: state.roofSections.map((sec) =>
              recomputeSection({ ...sec, panelWattage }, effectivePsh)
            ),
          };
        });
      },
      setViewMode: (viewMode) => set({ viewMode }),
      setIsDrawingMode: (isDrawingMode) => set({ isDrawingMode }),
      setSunHour: (sunHour) => set({ sunHour: Math.min(18, Math.max(6, sunHour)) }),

      setIrradianceProfile: (irradianceProfile) => {
        set((state) => {
          const effectivePsh =
            state.designBasis === 'worst_month'
              ? irradianceProfile.worstMonth.effectivePsh
              : state.designBasis === 'p25_conservative'
              ? irradianceProfile.p25EffectivePsh
              : irradianceProfile.annualAvgEffectivePsh;

          return {
            irradianceProfile,
            roofSections: state.roofSections.map((sec) =>
              recomputeSection(sec, effectivePsh)
            ),
          };
        });
      },

      setIsLoadingIrradiance: (isLoadingIrradiance) => set({ isLoadingIrradiance }),

      addRoofSection: (name) => {
        const id = `roof-${Date.now().toString(36)}`;
        const secCount = get().roofSections.length + 1;
        const newSection: RoofPolygonSection = {
          id,
          name: name || `Roof Face ${secCount} (South)`,
          vertices: [],
          pitchDeg: 15,
          azimuthDeg: 180, // Facing South
          shadingLossPercent: 0,
          setbackRatio: 0.82,
          panelOrientation: 'auto_best',
          panelWattage: get().panelWattage,
          flatAreaSqm: 0,
          slopedAreaSqm: 0,
          usableAreaSqm: 0,
          edgeLengthsMeters: [],
          maxPanelsPortrait: 0,
          maxPanelsLandscape: 0,
          recommendedMaxPanels: 0,
          placedPanels: [],
          maxArrayKwp: 0,
          orientationYieldFactor: 1.0,
          estimatedDailyKwh: 0,
          hasBowtieCross: false,
        };

        set((state) => ({
          roofSections: [...state.roofSections, newSection],
          activeSectionId: id,
          isDrawingMode: true,
        }));

        return id;
      },

      removeRoofSection: (id) => {
        set((state) => {
          const filtered = state.roofSections.filter((s) => s.id !== id);
          return {
            roofSections: filtered,
            activeSectionId:
              state.activeSectionId === id ? filtered[0]?.id ?? null : state.activeSectionId,
          };
        });
      },

      setActiveSectionId: (activeSectionId) => set({ activeSectionId }),

      updateRoofSectionConfig: (id, updates) => {
        const effectivePsh = get().getSelectedPsh();
        set((state) => ({
          roofSections: state.roofSections.map((sec) => {
            if (sec.id !== id) return sec;
            const updated = { ...sec, ...updates };
            return recomputeSection(updated, effectivePsh);
          }),
        }));
      },

      addVertexToActiveSection: (pt) => {
        const { activeSectionId, roofSections } = get();
        if (!activeSectionId && roofSections.length === 0) {
          get().addRoofSection();
        }

        const effectivePsh = get().getSelectedPsh();
        set((state) => {
          const targetId = state.activeSectionId || state.roofSections[0]?.id;
          if (!targetId) return state;

          return {
            roofSections: state.roofSections.map((sec) => {
              if (sec.id !== targetId) return sec;
              const newVertices = [...sec.vertices, pt];
              return recomputeSection({ ...sec, vertices: newVertices }, effectivePsh);
            }),
          };
        });
      },

      updateVertexPosition: (sectionId, index, pt) => {
        const effectivePsh = get().getSelectedPsh();
        set((state) => ({
          roofSections: state.roofSections.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const newVertices = [...sec.vertices];
            newVertices[index] = pt;
            return recomputeSection({ ...sec, vertices: newVertices }, effectivePsh);
          }),
        }));
      },

      removeVertex: (sectionId, index) => {
        const effectivePsh = get().getSelectedPsh();
        set((state) => ({
          roofSections: state.roofSections.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const newVertices = sec.vertices.filter((_, i) => i !== index);
            return recomputeSection({ ...sec, vertices: newVertices }, effectivePsh);
          }),
        }));
      },

      undoLastVertex: () => {
        const { activeSectionId } = get();
        if (!activeSectionId) return;
        const effectivePsh = get().getSelectedPsh();

        set((state) => ({
          roofSections: state.roofSections.map((sec) => {
            if (sec.id !== activeSectionId) return sec;
            const newVertices = sec.vertices.slice(0, -1);
            return recomputeSection({ ...sec, vertices: newVertices }, effectivePsh);
          }),
        }));
      },

      clearActivePolygon: () => {
        const { activeSectionId } = get();
        if (!activeSectionId) return;
        const effectivePsh = get().getSelectedPsh();

        set((state) => ({
          roofSections: state.roofSections.map((sec) => {
            if (sec.id !== activeSectionId) return sec;
            return recomputeSection({ ...sec, vertices: [] }, effectivePsh);
          }),
        }));
      },

      loadDemoRoofPolygon: () => {
        const center = get().coordinates;
        // Generate a realistic 10m x 6m residential roof polygon around center
        const halfWidth = 5.0; // meters (East-West)
        const halfLength = 3.2; // meters (North-South)

        const v1 = unprojectLocalMetersToGeo({ x: -halfWidth, y: -halfLength }, center);
        const v2 = unprojectLocalMetersToGeo({ x: halfWidth, y: -halfLength }, center);
        const v3 = unprojectLocalMetersToGeo({ x: halfWidth, y: halfLength }, center);
        const v4 = unprojectLocalMetersToGeo({ x: -halfWidth, y: halfLength }, center);

        const effectivePsh = get().getSelectedPsh();
        const demoSection: RoofPolygonSection = {
          id: `roof-demo-${Date.now().toString(36)}`,
          name: 'Main South Roof (Sample)',
          vertices: [v1, v2, v3, v4],
          pitchDeg: 15,
          azimuthDeg: 180,
          shadingLossPercent: 0,
          setbackRatio: 0.82,
          panelOrientation: 'portrait',
          panelWattage: get().panelWattage,
          flatAreaSqm: 0,
          slopedAreaSqm: 0,
          usableAreaSqm: 0,
          edgeLengthsMeters: [],
          maxPanelsPortrait: 0,
          maxPanelsLandscape: 0,
          recommendedMaxPanels: 0,
          placedPanels: [],
          maxArrayKwp: 0,
          orientationYieldFactor: 1.0,
          estimatedDailyKwh: 0,
          hasBowtieCross: false,
        };

        const computed = recomputeSection(demoSection, effectivePsh);

        set({
          roofSections: [computed],
          activeSectionId: computed.id,
          isDrawingMode: false,
        });
      },

      getSelectedPsh: () => {
        const { designBasis, irradianceProfile } = get();
        if (!irradianceProfile) return 4.5;
        switch (designBasis) {
          case 'worst_month':
            return irradianceProfile.worstMonth?.effectivePsh ?? 3.8;
          case 'p25_conservative':
            return irradianceProfile.p25EffectivePsh ?? 4.2;
          case 'annual_avg':
          default:
            return irradianceProfile.annualAvgEffectivePsh ?? 4.5;
        }
      },

      getSummary: () => {
        const { roofSections } = get();
        const totalFlatAreaSqm = Math.round(
          roofSections.reduce((s, r) => s + r.flatAreaSqm, 0) * 10
        ) / 10;
        const totalSlopedAreaSqm = Math.round(
          roofSections.reduce((s, r) => s + r.slopedAreaSqm, 0) * 10
        ) / 10;
        const totalUsableAreaSqm = Math.round(
          roofSections.reduce((s, r) => s + r.usableAreaSqm, 0) * 10
        ) / 10;
        const totalMaxPanels = roofSections.reduce((s, r) => s + r.recommendedMaxPanels, 0);
        const totalMaxKwp = Math.round(
          roofSections.reduce((s, r) => s + r.maxArrayKwp, 0) * 100
        ) / 100;
        const totalEstimatedDailyKwh = Math.round(
          roofSections.reduce((s, r) => s + r.estimatedDailyKwh, 0) * 10
        ) / 10;

        const effectivePsh = get().getSelectedPsh();

        return {
          sections: roofSections,
          totalFlatAreaSqm,
          totalSlopedAreaSqm,
          totalUsableAreaSqm,
          totalMaxPanels,
          totalMaxKwp,
          totalEstimatedDailyKwh,
          weightedEffectivePsh: effectivePsh,
        };
      },
    }),
    {
      name: 'kito_solar_mapper_v1',
      partialize: (state) => ({
        coordinates: state.coordinates,
        zoom: state.zoom,
        designBasis: state.designBasis,
        panelWattage: state.panelWattage,
        roofSections: state.roofSections,
        activeSectionId: state.activeSectionId,
        irradianceProfile: state.irradianceProfile,
      }),
    }
  )
);
