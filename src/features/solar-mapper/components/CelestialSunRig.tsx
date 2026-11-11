import React, { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { formatHourDecimal12h } from '@/lib/timeFormat';
import { getSunPosition } from '../utils/sunMath';

export const CelestialSunArc: React.FC<{ radius: number }> = ({ radius }) => {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let h = 6.0; h <= 18.0; h += 0.1) {
      const p = getSunPosition(h, radius);
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, [radius]);

  const milestoneHours = useMemo(
    () => [
      { h: 6.0, label: '6 AM (East)' },
      { h: 9.0, label: '9 AM' },
      { h: 12.0, label: '12 PM (South)' },
      { h: 15.0, label: '3 PM' },
      { h: 18.0, label: '6 PM (West)' },
    ],
    []
  );

  const markerSphereRadius = Math.max(0.22, radius * 0.007);
  const markerFontSize = Math.max(0.55, radius * 0.018);
  const markerTextY = Math.max(0.65, radius * 0.022);

  return (
    <group>
      <Line points={points} color="#fbbf24" lineWidth={3.5} transparent opacity={0.25} />
      <Line points={points} color="#f59e0b" lineWidth={1.5} transparent opacity={0.7} />

      {milestoneHours.map(({ h, label }) => {
        const pos = getSunPosition(h, radius);
        return (
          <group key={h} position={[pos.x, pos.y, pos.z]}>
            <mesh>
              <sphereGeometry args={[markerSphereRadius, 16, 16]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
            </mesh>
            <Text
              position={[0, markerTextY, 0]}
              fontSize={markerFontSize}
              color="#fef08a"
              anchorX="center"
              anchorY="bottom"
            >
              {label}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

export const SunlightRay: React.FC<{ sunPos: THREE.Vector3; targetPos: THREE.Vector3 }> = ({
  sunPos,
  targetPos,
}) => {
  const points: [number, number, number][] = useMemo(
    () => [
      [sunPos.x, sunPos.y, sunPos.z],
      [targetPos.x, targetPos.y, targetPos.z],
    ],
    [sunPos.x, sunPos.y, sunPos.z, targetPos.x, targetPos.y, targetPos.z]
  );

  return (
    <Line
      points={points}
      color="#fbbf24"
      lineWidth={1.5}
      transparent
      opacity={0.35}
      dashed
      dashSize={0.6}
      gapSize={0.4}
    />
  );
};

export const SunOrbAndLight: React.FC<{
  sunPos: THREE.Vector3;
  sunHour: number;
  orbitRadius: number;
}> = ({ sunPos, sunHour, orbitRadius }) => {
  const sunLightColor = useMemo(() => {
    if (sunHour < 7.5 || sunHour > 16.5) return '#fed7aa';
    if (sunHour < 9.5 || sunHour > 14.5) return '#fef08a';
    return '#ffffff';
  }, [sunHour]);

  return (
    <>
      <ambientLight intensity={0.55} color="#cbd5e1" />
      <directionalLight
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={2.0}
        color={sunLightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={orbitRadius * 3}
        shadow-camera-left={-orbitRadius * 0.9}
        shadow-camera-right={orbitRadius * 0.9}
        shadow-camera-top={orbitRadius * 0.9}
        shadow-camera-bottom={-orbitRadius * 0.9}
        shadow-bias={-0.0002}
      />

      <group position={[sunPos.x, sunPos.y, sunPos.z]}>
        <mesh>
          <sphereGeometry args={[Math.max(1.2, orbitRadius * 0.038), 32, 32]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh>
          <sphereGeometry args={[Math.max(1.8, orbitRadius * 0.057), 24, 24]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.4} />
        </mesh>
        <mesh>
          <sphereGeometry args={[Math.max(2.8, orbitRadius * 0.088), 24, 24]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.15} />
        </mesh>
        <Text
          position={[0, Math.max(2.2, orbitRadius * 0.07), 0]}
          fontSize={Math.max(0.85, orbitRadius * 0.027)}
          color="#fef08a"
          anchorX="center"
          anchorY="bottom"
        >
          {formatHourDecimal12h(sunHour)}
        </Text>
      </group>
    </>
  );
};
