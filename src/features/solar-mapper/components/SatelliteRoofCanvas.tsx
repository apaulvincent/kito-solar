// src/features/solar-mapper/components/SatelliteRoofCanvas.tsx
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PenTool,
  RotateCcw,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Sparkles,
  AlertTriangle,
  Move,
  Layers,
  Box,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { GeoPoint } from '../types/solarMapper';
import { calculateHaversineDistanceMeters } from '../utils/geodesicMath';

const TILE_SIZE = 256;

// Mercator Projection Math
function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function tileXToLng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export const SatelliteRoofCanvas: React.FC = () => {
  const {
    coordinates,
    setCoordinates,
    zoom,
    setZoom,
    roofSections,
    activeSectionId,
    setActiveSectionId,
    isDrawingMode,
    setIsDrawingMode,
    addVertexToActiveSection,
    updateVertexPosition,
    undoLastVertex,
    clearActivePolygon,
    addRoofSection,
    loadDemoRoofPolygon,
    setViewMode,
  } = useSolarMapperStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedVertex, setDraggedVertex] = useState<{
    sectionId: string;
    index: number;
  } | null>(null);

  // Resize observer to keep viewport responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(300, Math.round(entry.contentRect.width)),
          height: Math.max(300, Math.round(entry.contentRect.height)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Center coordinate in Web Mercator tile units
  const centerTileX = useMemo(
    () => lngToTileX(coordinates.lng, zoom) + panOffset.x / TILE_SIZE,
    [coordinates.lng, zoom, panOffset.x]
  );
  const centerTileY = useMemo(
    () => latToTileY(coordinates.lat, zoom) + panOffset.y / TILE_SIZE,
    [coordinates.lat, zoom, panOffset.y]
  );

  // Convert (lat, lng) to canvas (px, py)
  const geoToPixel = useCallback(
    (pt: GeoPoint) => {
      const tileX = lngToTileX(pt.lng, zoom);
      const tileY = latToTileY(pt.lat, zoom);
      const px = dimensions.width / 2 + (tileX - centerTileX) * TILE_SIZE;
      const py = dimensions.height / 2 + (tileY - centerTileY) * TILE_SIZE;
      return { px, py };
    },
    [zoom, centerTileX, centerTileY, dimensions.width, dimensions.height]
  );

  // Convert canvas (px, py) to (lat, lng)
  const pixelToGeo = useCallback(
    (px: number, py: number): GeoPoint => {
      const tileX = centerTileX + (px - dimensions.width / 2) / TILE_SIZE;
      const tileY = centerTileY + (py - dimensions.height / 2) / TILE_SIZE;
      return {
        lat: tileYToLat(tileY, zoom),
        lng: tileXToLng(tileX, zoom),
      };
    },
    [centerTileX, centerTileY, dimensions.width, dimensions.height, zoom]
  );

  // Compute visible tile indices for Slippy map
  const visibleTiles = useMemo(() => {
    const tilesAcross = Math.ceil(dimensions.width / TILE_SIZE) + 2;
    const tilesDown = Math.ceil(dimensions.height / TILE_SIZE) + 2;

    const startTileX = Math.floor(centerTileX - tilesAcross / 2);
    const startTileY = Math.floor(centerTileY - tilesDown / 2);

    const tiles: { key: string; x: number; y: number; px: number; py: number; url: string }[] = [];
    const maxTile = Math.pow(2, zoom);

    for (let ty = 0; ty <= tilesDown; ty++) {
      for (let tx = 0; tx <= tilesAcross; tx++) {
        const curX = ((startTileX + tx) % maxTile + maxTile) % maxTile;
        const curY = startTileY + ty;

        if (curY >= 0 && curY < maxTile) {
          const px = dimensions.width / 2 + (startTileX + tx - centerTileX) * TILE_SIZE;
          const py = dimensions.height / 2 + (curY - centerTileY) * TILE_SIZE;

          // Esri World Imagery (High-Res Global Satellite Basemap)
          const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${curY}/${curX}`;

          tiles.push({
            key: `${zoom}-${curX}-${curY}`,
            x: curX,
            y: curY,
            px,
            py,
            url,
          });
        }
      }
    }
    return tiles;
  }, [centerTileX, centerTileY, dimensions.width, dimensions.height, zoom]);

  // Pointer event handlers for drawing, dragging vertices, and panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.map-control-btn')) return;

    if (e.button === 0) {
      if (!isDrawingMode && !draggedVertex) {
        setIsPanning(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggedVertex) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const geo = pixelToGeo(px, py);
      updateVertexPosition(draggedVertex.sectionId, draggedVertex.index, geo);
      return;
    }

    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset((prev) => ({ x: prev.x - dx, y: prev.y - dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      // Persist new center when panning concludes
      const newCenter = pixelToGeo(dimensions.width / 2, dimensions.height / 2);
      setCoordinates(newCenter);
      setPanOffset({ x: 0, y: 0 });
    }
    if (draggedVertex) {
      setDraggedVertex(null);
    }
  };

  // Canvas Click: add vertex when in Draw Mode
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || draggedVertex) return;
    if ((e.target as HTMLElement).closest('.vertex-handle') || (e.target as HTMLElement).closest('.map-control-btn')) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const geo = pixelToGeo(px, py);

    addVertexToActiveSection(geo);
  };

  const activeSection = roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-slate-950 shadow-lg select-none">
      {/* Viewport Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleCanvasClick}
        className={`relative w-full h-[480px] sm:h-[560px] lg:h-[620px] overflow-hidden ${
          isDrawingMode
            ? 'cursor-crosshair'
            : isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
      >
        {/* Layer 1: Satellite Tiles */}
        <div className="absolute inset-0 pointer-events-none">
          {visibleTiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              className="absolute w-[256px] h-[256px] object-cover filter contrast-[1.05] brightness-[0.95]"
              style={{
                transform: `translate3d(${tile.px}px, ${tile.py}px, 0)`,
              }}
            />
          ))}
        </div>

        {/* Layer 2: Subtle Center Crosshair */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 z-10">
          <Crosshair className="w-6 h-6 text-amber-400 stroke-1" />
        </div>

        {/* Layer 3: Interactive SVG Overlay for Polygons, Panels & Measurement Badges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            {/* Solar Panel Module Pattern / Texture */}
            <pattern id="solar-panel-grid" width="4" height="6" patternUnits="userSpaceOnUse">
              <rect width="4" height="6" fill="#1e293b" />
              <line x1="0" y1="0" x2="4" y2="0" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Render All Roof Sections */}
          {roofSections.map((sec) => {
            const isActive = sec.id === activeSection?.id;
            const pts = sec.vertices.map(geoToPixel);
            if (pts.length === 0) return null;

            const pathD =
              pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`, '') +
              (pts.length > 2 ? ' Z' : '');

            const isBowtie = sec.hasBowtieCross;
            const strokeColor = isBowtie
              ? '#f43f5e'
              : isActive
              ? '#f59e0b'
              : '#94a3b8';
            const fillColor = isBowtie
              ? 'rgba(244, 63, 94, 0.25)'
              : isActive
              ? 'rgba(245, 158, 11, 0.22)'
              : 'rgba(148, 163, 184, 0.15)';

            return (
              <g key={sec.id}>
                {/* Polygon Area Fill & Stroke */}
                <path
                  d={pathD}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={pts.length < 3 ? '4 4' : undefined}
                  className="transition-colors duration-200"
                />

                {/* Render Placed Solar Panels Inside Closed Polygon */}
                {pts.length >= 3 &&
                  sec.placedPanels.map((panel) => {
                    // Approximate meter-to-pixel scale at current zoom & latitude
                    const meterToPx =
                      (Math.pow(2, zoom) * 256) /
                      (40075016 * Math.cos((coordinates.lat * Math.PI) / 180));

                    // Centroid pixel
                    const centroidPx = {
                      x: pts.reduce((s, p) => s + p.px, 0) / pts.length,
                      y: pts.reduce((s, p) => s + p.py, 0) / pts.length,
                    };

                    const panelPxX = centroidPx.x + panel.x * meterToPx;
                    const panelPxY = centroidPx.y - panel.y * meterToPx;
                    const panelPxW = Math.max(3, panel.widthM * meterToPx);
                    const panelPxH = Math.max(4, panel.lengthM * meterToPx);

                    return (
                      <rect
                        key={panel.id}
                        x={panelPxX - panelPxW / 2}
                        y={panelPxY - panelPxH / 2}
                        width={panelPxW}
                        height={panelPxH}
                        fill="#0c4a6e"
                        stroke="#38bdf8"
                        strokeWidth="0.8"
                        rx="1"
                        opacity={0.88}
                      />
                    );
                  })}

                {/* Edge Length Measurement Badges */}
                {pts.length >= 2 &&
                  pts.map((p1, i) => {
                    const nextIdx = (i + 1) % pts.length;
                    if (pts.length < 3 && nextIdx === 0) return null;
                    const p2 = pts[nextIdx];

                    const midX = (p1.px + p2.px) / 2;
                    const midY = (p1.py + p2.py) / 2;
                    const lengthM = calculateHaversineDistanceMeters(
                      sec.vertices[i],
                      sec.vertices[nextIdx]
                    );

                    return (
                      <g key={`edge-${sec.id}-${i}`}>
                        <rect
                          x={midX - 22}
                          y={midY - 10}
                          width="44"
                          height="20"
                          rx="6"
                          fill="#0f172a"
                          stroke={isActive ? '#f59e0b' : '#475569'}
                          strokeWidth="1"
                          opacity={0.92}
                        />
                        <text
                          x={midX}
                          y={midY + 4}
                          fill="#f8fafc"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {lengthM.toFixed(1)}m
                        </text>
                      </g>
                    );
                  })}

                {/* Draggable Vertex Corner Handles */}
                {isActive &&
                  pts.map((p, i) => (
                    <circle
                      key={`vertex-${sec.id}-${i}`}
                      cx={p.px}
                      cy={p.py}
                      r="6.5"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-move pointer-events-auto vertex-handle transition-transform hover:scale-125"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDraggedVertex({ sectionId: sec.id, index: i });
                      }}
                    />
                  ))}
              </g>
            );
          })}
        </svg>

        {/* Self-Intersection Warning Banner */}
        {activeSection?.hasBowtieCross && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-2 z-30">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Polygon edges are crossing (bowtie shape). Please uncross the corners.</span>
          </div>
        )}

        {/* Top-Right: Map Mode & View Mode Switcher */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          <button
            type="button"
            onClick={() => setViewMode('3d_preview')}
            className="map-control-btn px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/40 text-xs font-bold backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            title="Inspect 3D pitched roof & sun movement"
          >
            <Box className="w-4 h-4 text-amber-400" />
            <span>3D Roof & Sun View</span>
          </button>
        </div>

        {/* Floating Drawing & Zoom Action Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl z-30">
          <button
            type="button"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`map-control-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              isDrawingMode
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{isDrawingMode ? 'Finish Drawing' : 'Draw Roof'}</span>
          </button>

          <button
            type="button"
            onClick={loadDemoRoofPolygon}
            className="map-control-btn px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title="Load sample residential 4-corner roof"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sample Roof</span>
          </button>

          <div className="w-[1px] h-5 bg-slate-700/80 my-auto" />

          <button
            type="button"
            onClick={undoLastVertex}
            disabled={!activeSection || activeSection.vertices.length === 0}
            className="map-control-btn p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Undo last point"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={clearActivePolygon}
            disabled={!activeSection || activeSection.vertices.length === 0}
            className="map-control-btn p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Clear active roof polygon"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => addRoofSection()}
            className="map-control-btn px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
            title="Add second roof section (e.g. Garage)"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Add Section</span>
          </button>

          <div className="w-[1px] h-5 bg-slate-700/80 my-auto" />

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setZoom(zoom + 1)}
              disabled={zoom >= 20}
              className="map-control-btn p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(zoom - 1)}
              disabled={zoom <= 17}
              className="map-control-btn p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom-Right Coordinates / Zoom Indicator Badge */}
        <div className="absolute bottom-4 right-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md z-30">
          <span>Zoom: {zoom}</span>
          <span>•</span>
          <span>Esri Satellite</span>
        </div>
      </div>
    </div>
  );
};
