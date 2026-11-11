import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useCalculatorStore } from '@/store/useCalculatorStore';

export function AtsNodeGeometry() {
  const atsSource = useCalculatorStore((s) => s.atsSource);
  const toggleAtsSource = useCalculatorStore((s) => s.toggleAtsSource);
  const dialRef = useRef<THREE.Group>(null);

  // Left (-45 deg) selects Solar, right (+45 deg) selects Utility Grid.
  const targetRotation = atsSource === 'solar' ? -Math.PI / 4 : Math.PI / 4;

  useFrame((_, delta) => {
    if (dialRef.current) {
      dialRef.current.rotation.z = THREE.MathUtils.damp(
        dialRef.current.rotation.z,
        targetRotation,
        14,
        delta
      );
    }
  });

  const isSolar = atsSource === 'solar';
  const isUtility = atsSource === 'utility';

  return (
    <group>
      <RoundedBox args={[0.95, 1.22, 0.46]} radius={0.03} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#CBD5E1" metalness={0.6} roughness={0.35} />
      </RoundedBox>

      <mesh position={[0, 0, 0.225]}>
        <boxGeometry args={[0.9, 1.16, 0.015]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.65} roughness={0.3} />
      </mesh>

      {[-0.45, 0.45].map((hy, hIdx) => (
        <group key={`hinge-${hIdx}`} position={[-0.47, hy, 0.22]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 0.14, 16]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.02, 0, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.02]} />
            <meshStandardMaterial color="#64748B" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      <group position={[0.38, 0, 0.24]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.03, 0.16, 0.025]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      <group position={[0, 0.34, 0.235]}>
        <mesh position={[-0.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#F59E0B"
            emissiveIntensity={isSolar ? 1.0 : 0.2}
          />
        </mesh>
        <mesh position={[0.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={isUtility ? 1.0 : 0.2}
          />
        </mesh>
      </group>

      <group position={[0, -0.06, 0.235]}>
        <mesh position={[0, 0, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.265, 0.265, 0.012, 36]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
        </mesh>

        <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.016, 36]} />
          <meshStandardMaterial color="#0F172A" metalness={0.35} roughness={0.4} />
        </mesh>

        <mesh position={[0, 0.17, 0.017]}>
          <boxGeometry args={[0.008, 0.028, 0.005]} />
          <meshStandardMaterial color="#64748B" roughness={0.3} />
        </mesh>

        <group position={[-0.13, 0.13, 0.017]}>
          <mesh position={[0.02, -0.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.008, 0.028, 0.005]} />
            <meshStandardMaterial color={isSolar ? '#F59E0B' : '#64748B'} />
          </mesh>

          <group position={[-0.01, 0.03, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.008, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.008, 16]} />
              <meshStandardMaterial
                color="#F59E0B"
                emissive="#F59E0B"
                emissiveIntensity={isSolar ? 1.4 : 0.25}
              />
            </mesh>
          </group>

          <group position={[-0.01, -0.045, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.005, 16]} />
              <meshStandardMaterial
                color="#F59E0B"
                emissive="#F59E0B"
                emissiveIntensity={isSolar ? 0.6 : 0.15}
              />
            </mesh>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const r = 0.024;
              return (
                <mesh
                  key={`ray-left-${deg}`}
                  position={[Math.cos(rad) * r, Math.sin(rad) * r, 0]}
                  rotation={[0, 0, rad + Math.PI / 2]}
                >
                  <boxGeometry args={[0.003, 0.009, 0.004]} />
                  <meshStandardMaterial
                    color={isSolar ? '#FBBF24' : '#D97706'}
                    emissive={isSolar ? '#FBBF24' : '#000000'}
                    emissiveIntensity={isSolar ? 0.4 : 0}
                  />
                </mesh>
              );
            })}
          </group>
        </group>

        <group position={[0.13, 0.13, 0.017]}>
          <mesh position={[-0.02, -0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.008, 0.028, 0.005]} />
            <meshStandardMaterial color={isUtility ? '#10B981' : '#64748B'} />
          </mesh>

          <group position={[0.01, 0.03, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.008, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.008, 16]} />
              <meshStandardMaterial
                color="#10B981"
                emissive="#10B981"
                emissiveIntensity={isUtility ? 1.4 : 0.25}
              />
            </mesh>
          </group>

          <group position={[0.01, -0.045, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.006, 0.05, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            <mesh position={[0, 0.012, 0]}>
              <boxGeometry args={[0.038, 0.005, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            <mesh position={[0, -0.004, 0]}>
              <boxGeometry args={[0.048, 0.005, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            <mesh position={[-0.014, -0.016, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.004, 0.024, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            <mesh position={[0.014, -0.016, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.004, 0.024, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
          </group>
        </group>

        <mesh position={[0, 0, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.12, 0.02, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>

        <group
          ref={dialRef}
          position={[0, 0, 0.034]}
          rotation={[0, 0, targetRotation]}
          onClick={(e) => {
            e.stopPropagation();
            toggleAtsSource();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.095, 0.06, 24]} />
            <meshStandardMaterial color="#1E293B" metalness={0.4} roughness={0.3} />
          </mesh>

          <mesh position={[0, 0.06, 0.045]}>
            <boxGeometry args={[0.075, 0.22, 0.09]} />
            <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.35} />
          </mesh>

          {[-0.04, 0.04].map((rx, rIdx) => (
            <mesh key={`ridge-${rIdx}`} position={[rx, 0.05, 0.045]}>
              <boxGeometry args={[0.005, 0.16, 0.07]} />
              <meshStandardMaterial color="#1E293B" roughness={0.4} />
            </mesh>
          ))}

          <mesh position={[0, 0.07, 0.092]}>
            <boxGeometry args={[0.012, 0.17, 0.004]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.2} />
          </mesh>

          <mesh position={[0, 0.19, 0.045]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.038, 0.06, 3]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
