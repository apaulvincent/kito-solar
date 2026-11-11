import React, { useMemo } from 'react';
import * as THREE from 'three';
import { GeoPoint, RoofPolygonSection } from '../types/solarMapper';
import {
  calculateCentroid,
  getOuterTiltSides,
  projectSinglePointToMeters,
  projectVerticesToLocalMeters,
} from '../utils/geodesicMath';
import { degToRad, getPivotSideAngleRad } from '../utils/geometryAngles';
import { BUILDING_EAVE_HEIGHT } from '../utils/sunMath';
import { PlacedPanelsInstanced } from './PlacedPanelsInstanced';

interface Roof3DMeshProps {
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  isActive: boolean;
  onSelect: () => void;
}

export const Roof3DMesh: React.FC<Roof3DMeshProps> = React.memo(
  ({ section, siteCenter, isActive, onSelect }) => {
    const secCentroid = useMemo(
      () => calculateCentroid(section.vertices),
      [section.vertices]
    );

    const secCentroidMeters = useMemo(
      () => projectSinglePointToMeters(secCentroid, siteCenter),
      [secCentroid, siteCenter]
    );

    const localVertices = useMemo(
      () => projectVerticesToLocalMeters(section.vertices),
      [section.vertices]
    );

    const shape = useMemo(() => {
      if (localVertices.length < 3) return null;
      const s = new THREE.Shape();
      s.moveTo(localVertices[0].x, localVertices[0].y);
      for (let i = 1; i < localVertices.length; i++) {
        s.lineTo(localVertices[i].x, localVertices[i].y);
      }
      s.closePath();
      return s;
    }, [localVertices]);

    const sideAngleRad = useMemo(() => {
      if (section.vertices.length < 3) return 0;
      return getPivotSideAngleRad(getOuterTiltSides(section.vertices), section.pivotEdgeIndex);
    }, [section.vertices, section.pivotEdgeIndex]);

    const roofExtrudeSettings = useMemo(
      () => ({
        depth: 0.14,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.03,
        bevelThickness: 0.03,
      }),
      []
    );

    if (!shape) return null;

    const centerX = secCentroidMeters.x;
    const centerY = section.baseHeightMeters ?? BUILDING_EAVE_HEIGHT;
    const centerZ = -secCentroidMeters.y;
    const pitchRad = degToRad(section.pitchDeg);
    const rollRad = degToRad(section.rollDeg ?? 0);

    return (
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
      >
        <group position={[centerX, centerY, centerZ]}>
          {/* Outer/inner Y rotations align pitch & roll strictly along traced roof edges while preserving 2D footprint yaw */}
          <group rotation={[0, sideAngleRad, 0]}>
            <group rotation={[pitchRad, 0, rollRad]}>
              <group rotation={[0, -sideAngleRad, 0]}>
                <group rotation={[-Math.PI / 2, 0, 0]}>
                  <mesh receiveShadow castShadow position={[0, 0, -0.07]}>
                    <extrudeGeometry args={[shape, roofExtrudeSettings]} />
                    <meshStandardMaterial
                      color={isActive ? '#e2e8f0' : '#cbd5e1'}
                      roughness={0.65}
                      metalness={0.1}
                    />
                  </mesh>

                  {isActive && (
                    <mesh position={[0, 0, 0.075]}>
                      <extrudeGeometry
                        args={[
                          shape,
                          { depth: 0.01, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.01 },
                        ]}
                      />
                      <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} wireframe />
                    </mesh>
                  )}

                  <PlacedPanelsInstanced panels={section.placedPanels || []} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    );
  }
);
