import * as THREE from 'three';
import { GeoPoint, RoofPolygonSection } from '../types/solarMapper';
import {
  calculateCentroid,
  getOuterTiltSides,
  projectSinglePointToMeters,
} from './geodesicMath';
import { degToRad, getPivotSideAngleRad } from './geometryAngles';

export const BUILDING_EAVE_HEIGHT = 4.0;
export const CELESTIAL_ORBIT_RADIUS = 28;

// Peak solar noon elevation angle (~72 deg in tropical Philippines)
const PEAK_SOLAR_ELEVATION_RAD = degToRad(72);

/**
 * Celestial 3D Sun position along sunrise (East +X) -> solar noon (South +Z) -> sunset (West -X).
 */
export function getSunPosition(
  hourDecimal: number,
  radius = CELESTIAL_ORBIT_RADIUS
): THREE.Vector3 {
  const clampedH = Math.max(6.0, Math.min(18.0, hourDecimal));
  const t = (clampedH - 6.0) / 12.0;
  const omega = (t - 0.5) * Math.PI;

  const x = -radius * Math.sin(omega);
  const y = radius * Math.cos(omega) * Math.sin(PEAK_SOLAR_ELEVATION_RAD);
  const z = radius * Math.cos(omega) * Math.cos(PEAK_SOLAR_ELEVATION_RAD);

  return new THREE.Vector3(x, Math.max(0.5, y), z);
}

/**
 * Computes the 3D world position of a roof's surface anchor 0.45m normal to its tilted deck plane.
 */
export function getRoofAnchorWorldPos(
  section: Pick<
    RoofPolygonSection,
    'vertices' | 'baseHeightMeters' | 'pitchDeg' | 'rollDeg' | 'pivotEdgeIndex'
  >,
  siteCenter: GeoPoint
): THREE.Vector3 {
  const secCentroid = calculateCentroid(section.vertices);
  const secCentroidMeters = projectSinglePointToMeters(secCentroid, siteCenter);
  const centerX = secCentroidMeters.x;
  const centerY = section.baseHeightMeters ?? BUILDING_EAVE_HEIGHT;
  const centerZ = -secCentroidMeters.y;

  const sideAngleRad =
    section.vertices.length >= 3
      ? getPivotSideAngleRad(getOuterTiltSides(section.vertices), section.pivotEdgeIndex)
      : 0;

  const pitchRad = degToRad(section.pitchDeg);
  const rollRad = degToRad(section.rollDeg ?? 0);

  const offset = new THREE.Vector3(0, 0.45, 0);
  offset.applyEuler(new THREE.Euler(pitchRad, 0, rollRad, 'XYZ'));
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), sideAngleRad);

  return new THREE.Vector3(
    centerX + offset.x,
    centerY + offset.y,
    centerZ + offset.z
  );
}

export function rayFromClientCoords(
  clientX: number,
  clientY: number,
  domElement: HTMLElement,
  camera: THREE.Camera
): THREE.Ray {
  const rect = domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  return raycaster.ray;
}
