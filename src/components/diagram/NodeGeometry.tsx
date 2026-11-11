import { RoundedBox } from '@react-three/drei';
import { NodeType } from '@/types/layout3d';
import { getBreakerAppearance, getNodeTypeFromKey } from '@/lib/diagramNodeSpecs';
import { AtsNodeGeometry } from './AtsNodeGeometry';

export interface NodeGeometryProps {
  nodeType?: NodeType;
  nodeKey?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  isStandalone?: boolean;
}

export function NodeGeometry({
  nodeType: rawNodeType,
  nodeKey,
  isSelected = false,
  isHovered = false,
  isStandalone = false,
}: NodeGeometryProps) {
  const nodeType: NodeType = rawNodeType || (nodeKey ? getNodeTypeFromKey(nodeKey) : 'breaker');
  const breakerAppearance = getBreakerAppearance(nodeKey);

  switch (nodeType) {
    case 'pv':
      return (
        <group>
          {[-1.3, 0, 1.3].map((modX, modIdx) => (
            <group key={`pv-mod-${modIdx}`} position={[modX, 0.067, 0]}>
              <mesh rotation={[0.38, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.05, 1.68]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh position={[0, 0.026, 0]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[1.18, 0.005, 1.66]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} wireframe />
              </mesh>
              <mesh position={[0, 0.028, 0]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[1.15, 0.01, 1.63]} />
                <meshStandardMaterial
                  color={isSelected || isHovered ? '#0284C7' : '#0B192C'}
                  roughness={0.12}
                  metalness={0.65}
                />
              </mesh>
              <mesh position={[0, 0.034, 0]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[1.13, 0.004, 1.59]} />
                <meshStandardMaterial color="#E2E8F0" wireframe transparent opacity={0.35} />
              </mesh>
            </group>
          ))}

          <mesh position={[0, -0.15, 0.45]} rotation={[0.38, 0, 0]} castShadow>
            <boxGeometry args={[3.92, 0.05, 0.08]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.86} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.184, -0.45]} rotation={[0.38, 0, 0]} castShadow>
            <boxGeometry args={[3.92, 0.05, 0.08]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.86} roughness={0.25} />
          </mesh>

          {[-0.65, 0.65].map((cx, cIdx) => (
            <group key={`mc-${cIdx}`} position={[cx, 0, 0]}>
              <mesh position={[0, -0.13, 0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.204, -0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}

          {[-1.92, 1.92].map((ex, eIdx) => (
            <group key={`ec-${eIdx}`} position={[ex, 0, 0]}>
              <mesh position={[0, -0.13, 0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.05, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.204, -0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.05, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}

          {[-1.3, 0.0, 1.3].map((legX, lIdx) => (
            <group key={`leg-${lIdx}`} position={[legX, 0, 0]}>
              <mesh position={[0, -0.72, 0.45]} receiveShadow>
                <boxGeometry args={[0.28, 0.06, 0.28]} />
                <meshStandardMaterial color="#94A3B8" roughness={0.85} metalness={0.12} />
              </mesh>
              <mesh position={[0, -0.72, -0.45]} receiveShadow>
                <boxGeometry args={[0.28, 0.06, 0.28]} />
                <meshStandardMaterial color="#94A3B8" roughness={0.85} metalness={0.12} />
              </mesh>

              <mesh position={[0, -0.684, 0.45]}>
                <boxGeometry args={[0.16, 0.012, 0.16]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh position={[0, -0.684, -0.45]}>
                <boxGeometry args={[0.16, 0.012, 0.16]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.22} />
              </mesh>

              <mesh position={[0, -0.415, 0.45]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.53, 12]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
              </mesh>

              <mesh position={[0, -0.248, -0.45]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.864, 12]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
              </mesh>

              <mesh position={[0, -0.248, 0.0]} rotation={[-0.8, 0, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 1.08, 8]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.28} />
              </mesh>
            </group>
          ))}

          <group position={[0, 0.184, -0.52]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.36, 0.26, 0.14]} />
              <meshStandardMaterial color="#F1F5F9" metalness={0.25} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.08, 12]} />
              <meshStandardMaterial color="#D97706" metalness={0.85} />
            </mesh>
          </group>
        </group>
      );

    case 'isolator':
      return (
        <group>
          <RoundedBox args={[0.85, 1.05, 0.42]} radius={0.035} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#E2E8F0" roughness={0.35} metalness={0.12} />
          </RoundedBox>

          <mesh position={[0, 0, 0.205]}>
            <boxGeometry args={[0.83, 1.03, 0.015]} />
            <meshStandardMaterial color="#1E293B" roughness={0.7} />
          </mesh>

          {[
            [-0.36, 0.46],
            [0.36, 0.46],
            [-0.36, -0.46],
            [0.36, -0.46],
          ].map(([sx, sy], idx) => (
            <group key={`sc-${idx}`} position={[sx, sy, 0.215]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.006]}>
                <boxGeometry args={[0.025, 0.005, 0.005]} />
                <meshStandardMaterial color="#64748B" metalness={0.8} />
              </mesh>
            </group>
          ))}

          <mesh position={[0, 0.55, -0.05]}>
            <boxGeometry args={[0.3, 0.06, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.55, -0.05]}>
            <boxGeometry args={[0.3, 0.06, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>

          <RoundedBox args={[0.62, 0.78, 0.02]} radius={0.02} smoothness={4} position={[0, 0.02, 0.22]}>
            <meshStandardMaterial color="#F59E0B" roughness={0.3} metalness={0.08} />
          </RoundedBox>

          <mesh position={[0, 0.08, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 32]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} />
          </mesh>

          <mesh position={[0, 0.29, 0.245]}>
            <boxGeometry args={[0.04, 0.012, 0.005]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[-0.21, 0.08, 0.245]}>
            <boxGeometry args={[0.012, 0.04, 0.005]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>

          <mesh position={[0, 0.08, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.035, 24]} />
            <meshStandardMaterial color="#EAB308" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.08, 0.265]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
            <meshStandardMaterial color="#0F172A" />
          </mesh>

          <mesh position={[0, 0.08, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.13, 0.08, 24]} />
            <meshStandardMaterial color="#DC2626" roughness={0.28} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.12, 0.36]}>
            <boxGeometry args={[0.09, 0.34, 0.12]} />
            <meshStandardMaterial color="#B91C1C" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.31, 0.36]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.05, 0.08, 3]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>

          <group position={[0, -0.24, 0.235]}>
            <mesh>
              <boxGeometry args={[0.38, 0.14, 0.005]} />
              <meshStandardMaterial color="#0F172A" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.003]}>
              <boxGeometry args={[0.36, 0.12, 0.005]} />
              <meshStandardMaterial color="#FEF08A" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.006]}>
              <boxGeometry args={[0.28, 0.03, 0.005]} />
              <meshStandardMaterial color="#DC2626" />
            </mesh>
          </group>

          <group position={[0, -0.56, 0]}>
            <mesh position={[-0.15, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
              <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.2} />
            </mesh>
            <mesh position={[0.15, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
              <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.2} />
            </mesh>
          </group>
        </group>
      );

    case 'breaker':
      return (
        <group>
          <RoundedBox args={[0.78, 0.98, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.12} />
          </RoundedBox>

          <mesh position={[0, 0.08, 0.16]}>
            <boxGeometry args={[0.66, 0.6, 0.12]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
          </mesh>

          <mesh position={[0, 0.08, 0.13]}>
            <boxGeometry args={[0.6, 0.04, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.22} />
          </mesh>

          {[-0.12, 0.12].map((bx, bIdx) => (
            <group key={`mcb-${bIdx}`} position={[bx, 0.08, 0.18]}>
              <RoundedBox args={[0.22, 0.48, 0.16]} radius={0.015} smoothness={4}>
                <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
              </RoundedBox>
              <mesh position={[0, 0.15, 0.085]}>
                <boxGeometry args={[0.06, 0.04, 0.005]} />
                <meshStandardMaterial color="#DC2626" />
              </mesh>
              <mesh position={[0, 0.02, 0.1]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.08, 0.16, 0.06]} />
                <meshStandardMaterial
                  color={breakerAppearance.toggleColor}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 0.2, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} />
              </mesh>
              <mesh position={[0, -0.2, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} />
              </mesh>
            </group>
          ))}

          {breakerAppearance.hasTieBar && (
            <mesh position={[0, 0.1, 0.3]}>
              <boxGeometry args={[0.32, 0.04, 0.03]} />
              <meshStandardMaterial color={breakerAppearance.toggleColor} roughness={0.3} />
            </mesh>
          )}

          <RoundedBox args={[0.62, 0.56, 0.03]} radius={0.015} smoothness={4} position={[0, 0.08, 0.23]}>
            <meshStandardMaterial
              color="#0F172A"
              transparent
              opacity={0.45}
              roughness={0.08}
              metalness={0.2}
            />
          </RoundedBox>

          <mesh position={[0, -0.32, 0.222]}>
            <boxGeometry args={[0.54, 0.12, 0.005]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>

          <mesh position={[0, 0.51, -0.05]}>
            <boxGeometry args={[0.3, 0.04, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.51, -0.05]}>
            <boxGeometry args={[0.3, 0.04, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      );

    case 'spd':
      return (
        <group>
          <RoundedBox args={[0.78, 0.95, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.12} />
          </RoundedBox>

          {[-0.18, 0.18].map((cx, cIdx) => (
            <group key={`spd-cart-${cIdx}`} position={[cx, 0.06, 0.16]}>
              <RoundedBox args={[0.26, 0.56, 0.22]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.08} />
              </RoundedBox>
              <mesh position={[0, 0.12, 0.115]}>
                <boxGeometry args={[0.12, 0.08, 0.005]} />
                <meshStandardMaterial
                  color="#10B981"
                  emissive="#10B981"
                  emissiveIntensity={0.85}
                  roughness={0.2}
                />
              </mesh>
              <mesh position={[0, -0.06, 0.115]}>
                <boxGeometry args={[0.14, 0.14, 0.005]} />
                <meshStandardMaterial color="#1E293B" roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.22, 0.1]}>
                <boxGeometry args={[0.18, 0.04, 0.03]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.8} />
              </mesh>
            </group>
          ))}

          <group position={[0, -0.485, 0.1]}>
            <mesh>
              <cylinderGeometry args={[0.045, 0.045, 0.018, 6]} />
              <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.015, 0]}>
              <cylinderGeometry args={[0.034, 0.038, 0.024, 16]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.028, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.012, 16]} />
              <meshStandardMaterial color="#1E293B" roughness={0.6} />
            </mesh>
          </group>

          <mesh position={[0, -0.32, 0.222]}>
            <boxGeometry args={[0.54, 0.1, 0.005]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} />
          </mesh>
        </group>
      );

    case 'inverter':
      return (
        <group>
          <RoundedBox args={[1.56, 1.76, 0.44]} radius={0.045} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial
              color={isSelected || isHovered ? '#FFFFFF' : '#F8FAFC'}
              roughness={0.22}
              metalness={0.18}
            />
          </RoundedBox>

          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[1.58, 1.78, 0.02]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.75} roughness={0.2} />
          </mesh>

          {[-0.78, 0.78].map((sideX, sideIdx) => (
            <group key={`side-heatsink-${sideIdx}`} position={[sideX, 0, -0.1]}>
              {Array.from({ length: 8 }).map((_, finIdx) => (
                <mesh
                  key={`fin-${finIdx}`}
                  position={[sideX < 0 ? 0.04 : -0.04, 0, (finIdx - 3.5) * 0.05]}
                >
                  <boxGeometry args={[0.015, 1.55, 0.035]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
                </mesh>
              ))}
            </group>
          ))}

          <mesh position={[0, 0.86, 0]}>
            <boxGeometry args={[1.2, 0.06, 0.32]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>

          <RoundedBox args={[1.1, 0.76, 0.02]} radius={0.02} smoothness={4} position={[0, 0.28, 0.225]}>
            <meshStandardMaterial color="#0A0F1D" roughness={0.1} metalness={0.3} />
          </RoundedBox>

          <mesh position={[0, 0.3, 0.237]}>
            <planeGeometry args={[0.96, 0.54]} />
            <meshStandardMaterial color="#030712" roughness={0.05} />
          </mesh>

          <mesh position={[-0.22, 0.44, 0.239]}>
            <planeGeometry args={[0.42, 0.08]} />
            <meshStandardMaterial
              color="#F59E0B"
              emissive="#F59E0B"
              emissiveIntensity={0.8}
              roughness={0.2}
            />
          </mesh>

          <mesh position={[0.22, 0.44, 0.239]}>
            <planeGeometry args={[0.42, 0.08]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive="#38BDF8"
              emissiveIntensity={0.85}
              roughness={0.2}
            />
          </mesh>

          <mesh position={[0, 0.3, 0.239]}>
            <planeGeometry args={[0.82, 0.1]} />
            <meshStandardMaterial
              color="#10B981"
              emissive="#10B981"
              emissiveIntensity={0.7}
              roughness={0.2}
            />
          </mesh>

          <mesh position={[0, 0.16, 0.239]}>
            <planeGeometry args={[0.86, 0.06]} />
            <meshStandardMaterial
              color="#94A3B8"
              emissive="#38BDF8"
              emissiveIntensity={0.4}
              roughness={0.2}
            />
          </mesh>

          {[
            { x: -0.3, label: 'PWR', color: '#10B981', active: true },
            { x: -0.1, label: 'INV', color: '#38BDF8', active: true },
            { x: 0.1, label: 'COMM', color: '#F59E0B', active: true },
            { x: 0.3, label: 'ALARM', color: '#64748B', active: false },
          ].map((led, lIdx) => (
            <group key={`led-${lIdx}`} position={[led.x, 0.02, 0.23]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                <meshStandardMaterial
                  color={led.color}
                  emissive={led.active ? led.color : '#000000'}
                  emissiveIntensity={led.active ? 1.0 : 0}
                  roughness={0.2}
                />
              </mesh>
            </group>
          ))}

          <group position={[-0.48, -0.34, 0.22]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
              <meshStandardMaterial color="#FBBF24" />
            </mesh>
            <mesh position={[0, 0, 0.025]}>
              <boxGeometry args={[0.04, 0.14, 0.05]} />
              <meshStandardMaterial color="#DC2626" />
            </mesh>
          </group>

          <mesh position={[0.15, -0.34, 0.222]}>
            <boxGeometry args={[0.6, 0.12, 0.005]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
          </mesh>

          <group position={[0, -0.86, 0]}>
            <mesh>
              <boxGeometry args={[1.2, 0.06, 0.32]} />
              <meshStandardMaterial color="#1E293B" roughness={0.4} />
            </mesh>
            {[-0.35, -0.25, -0.15, -0.05].map((mcX, mcIdx) => (
              <mesh key={`mc-${mcIdx}`} position={[mcX, -0.05, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
                <meshStandardMaterial color="#0F172A" roughness={0.3} />
              </mesh>
            ))}
            <mesh position={[0.3, -0.05, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
            </mesh>
          </group>

          <mesh position={[0, 0.78, -0.22]}>
            <boxGeometry args={[1.4, 0.06, 0.04]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.72, -0.22]}>
            <boxGeometry args={[1.4, 0.06, 0.04]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'battery':
      return (
        <group>
          <RoundedBox args={[1.38, 1.56, 0.52]} radius={0.04} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial
              color={isSelected || isHovered ? '#FFFFFF' : '#F8FAFC'}
              roughness={0.22}
              metalness={0.18}
            />
          </RoundedBox>

          <mesh position={[-0.7, 0, 0]}>
            <boxGeometry args={[0.04, 1.54, 0.5]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[0.7, 0, 0]}>
            <boxGeometry args={[0.04, 1.54, 0.5]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
          </mesh>

          <group position={[0, 0.4, 0.265]}>
            <mesh>
              <boxGeometry args={[0.96, 0.08, 0.015]} />
              <meshStandardMaterial color="#0F172A" roughness={0.5} />
            </mesh>
            {Array.from({ length: 10 }).map((_, sIdx) => (
              <mesh key={`soc-${sIdx}`} position={[(sIdx - 4.5) * 0.088, 0, 0.008]}>
                <boxGeometry args={[0.065, 0.045, 0.008]} />
                <meshStandardMaterial
                  color="#10B981"
                  emissive="#10B981"
                  emissiveIntensity={1.2}
                  roughness={0.15}
                />
              </mesh>
            ))}
          </group>

          <group position={[-0.45, 0.78, 0]}>
            <mesh>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
              <meshStandardMaterial color="#DC2626" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
              <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
          <group position={[-0.25, 0.78, 0]}>
            <mesh>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
              <meshStandardMaterial color="#0F172A" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
              <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>

          <group position={[0.45, 0.78, 0]}>
            <mesh>
              <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
              <meshStandardMaterial
                color="#10B981"
                emissive="#10B981"
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>

          <mesh position={[0, -0.35, 0.262]}>
            <boxGeometry args={[0.7, 0.16, 0.005]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
        </group>
      );

    case 'ats':
      return <AtsNodeGeometry />;

    case 'panel':
      return (
        <group>
          <RoundedBox args={[1.15, 1.65, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#64748B" metalness={0.65} roughness={0.32} />
          </RoundedBox>

          <mesh position={[0, 0, 0.215]}>
            <boxGeometry args={[1.05, 1.54, 0.02]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[-0.53, 0, 0.215]}>
            <cylinderGeometry args={[0.015, 0.015, 1.5, 12]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>

          <group position={[0.42, 0, 0.23]}>
            <mesh>
              <boxGeometry args={[0.05, 0.22, 0.02]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.92} roughness={0.15} />
            </mesh>
            <mesh position={[0, -0.04, 0.015]}>
              <boxGeometry args={[0.03, 0.12, 0.02]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.12} />
            </mesh>
          </group>

          <group position={[0, 0.42, 0.23]} rotation={[0, 0, Math.PI]}>
            <mesh>
              <coneGeometry args={[0.16, 0.26, 3]} />
              <meshStandardMaterial color="#FBBF24" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
              <boxGeometry args={[0.025, 0.1, 0.005]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
          </group>

          <mesh position={[0, -0.38, 0.23]}>
            <boxGeometry args={[0.65, 0.38, 0.01]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.4} transparent opacity={0.85} />
          </mesh>
        </group>
      );

    case 'grounding': {
      const busbarWidth = 0.62; // Standard 24" (600 mm) UL 467 Master Ground Busbar
      const busbarHeight = 0.10; // 4" (100 mm) height
      const busbarThickness = 0.012; // 1/2" thick solid electrolytic copper
      const standoffXs = [-0.22, 0.22];
      const lugPositions = [-0.22, -0.13, -0.04, 0.05, 0.14, 0.22];

      return (
        <group>
          {/* 1. Solid Polished Electrolytic Copper Busbar Plate (UL 467 Listed) */}
          <mesh position={[0, 0, 0.012]} castShadow receiveShadow>
            <boxGeometry args={[busbarWidth, busbarHeight, busbarThickness]} />
            <meshStandardMaterial
              color={isSelected || isHovered ? '#EA580C' : '#B45309'}
              metalness={0.96}
              roughness={0.16}
            />
          </mesh>

          <mesh position={[0, 0, 0.018]}>
            <boxGeometry args={[busbarWidth - 0.01, busbarHeight - 0.01, 0.002]} />
            <meshStandardMaterial
              color="#D97706"
              metalness={0.92}
              roughness={0.2}
              wireframe
            />
          </mesh>

          {standoffXs.map((sx, sIdx) => (
            <group key={`ins-${sIdx}`} position={[sx, 0, -0.015]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.024, 0.024, 0.042, 12]} />
                <meshStandardMaterial color="#DC2626" roughness={0.35} metalness={0.1} />
              </mesh>
              <mesh position={[0, 0, -0.02]}>
                <boxGeometry args={[0.046, 0.08, 0.008]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
              </mesh>
              {[-0.028, 0.028].map((ly, lIdx) => (
                <mesh key={`lag-${lIdx}`} position={[0, ly, -0.018]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.012, 6]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
                </mesh>
              ))}
            </group>
          ))}

          {lugPositions.map((lx, lIdx) => (
            <group key={`lug-${lx}`} position={[lx, 0, 0.026]}>
              <mesh>
                <boxGeometry args={[0.038, 0.052, 0.024]} />
                <meshStandardMaterial color="#D97706" metalness={0.92} roughness={0.22} />
              </mesh>
              {[-0.014, 0.014].map((by, bIdx) => (
                <mesh key={`bolt-${bIdx}`} position={[0, by, 0.013]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.012, 6]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.92} roughness={0.18} />
                </mesh>
              ))}
              {lIdx % 2 === 0 && (
                <group position={[0, 0.08, -0.005]}>
                  <mesh>
                    <cylinderGeometry args={[0.008, 0.008, 0.12, 12]} />
                    <meshStandardMaterial color="#10B981" roughness={0.3} />
                  </mesh>
                </group>
              )}
            </group>
          ))}

          {!isStandalone && (
            <group position={[0, 0, 0]}>
              <mesh position={[0, -0.06, 0.02]}>
                <cylinderGeometry args={[0.008, 0.008, 0.07, 12]} />
                <meshStandardMaterial color="#B45309" metalness={0.95} roughness={0.16} />
              </mesh>

              <mesh position={[0, -0.10, 0.005]}>
                <cylinderGeometry args={[0.026, 0.026, 0.025, 16]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.22} />
              </mesh>

              <mesh position={[0, -0.425, 0.005]}>
                <cylinderGeometry args={[0.020, 0.020, 0.65, 20]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.20} />
              </mesh>

              <group position={[0, -0.42, 0.005]}>
                <mesh>
                  <cylinderGeometry args={[0.028, 0.028, 0.035, 16]} />
                  <meshStandardMaterial color="#64748B" metalness={0.85} roughness={0.25} />
                </mesh>
                <mesh position={[0, 0, -0.015]}>
                  <boxGeometry args={[0.08, 0.035, 0.01]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} />
                </mesh>
              </group>

              <group position={[0, -0.74, 0.005]}>
                <mesh>
                  <cylinderGeometry args={[0.045, 0.052, 0.025, 16]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.015, 0]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.008, 16]} />
                  <meshStandardMaterial color="#EAB308" roughness={0.25} />
                </mesh>
              </group>

              <group position={[0.14, 0.44, 0.005]}>
                <mesh>
                  <cylinderGeometry args={[0.009, 0.009, 0.78, 12]} />
                  <meshStandardMaterial color="#10B981" roughness={0.3} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      );
    }

    case 'grid':
      return (
        <group>
          <mesh position={[0, -1.54, 0]} receiveShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.12, 16]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.85} metalness={0.15} />
          </mesh>

          <mesh position={[0, -1.47, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
          </mesh>

          <mesh position={[0, 0.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.09, 0.15, 3.2, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.65} roughness={0.35} />
          </mesh>

          <mesh position={[0, 1.45, 0]} castShadow>
            <boxGeometry args={[1.3, 0.09, 0.09]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </mesh>

          {[-0.5, 0, 0.5].map((ix, iIdx) => (
            <group key={`ins-grid-${iIdx}`} position={[ix, 1.58, 0]}>
              <mesh>
                <cylinderGeometry args={[0.045, 0.055, 0.16, 12]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.15} metalness={0.1} />
              </mesh>
            </group>
          ))}

          <mesh position={[0.22, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.45, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.28} />
          </mesh>

          <group position={[-0.15, 0.0, 0.1]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.14, 0.2, 0.08]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.02, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
              <meshStandardMaterial color="#BAE6FD" transparent opacity={0.65} roughness={0.1} />
            </mesh>
          </group>

          <mesh position={[-0.15, -0.74, 0.08]}>
            <cylinderGeometry args={[0.018, 0.018, 1.48, 12]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'load':
      return (
        <group>
          <mesh position={[0, -0.76, 0]} receiveShadow>
            <boxGeometry args={[1.7, 0.08, 1.7]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.82} metalness={0.15} />
          </mesh>

          <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.0, 1.5]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.38} metalness={0.08} />
          </mesh>

          <mesh position={[-0.42, -0.22, 0.756]}>
            <boxGeometry args={[0.52, 0.98, 0.015]} />
            <meshStandardMaterial color="#B45309" roughness={0.55} metalness={0.12} />
          </mesh>

          <mesh position={[-0.42, -0.34, 0.768]} castShadow>
            <boxGeometry args={[0.34, 0.74, 0.02]} />
            <meshStandardMaterial color="#1E293B" roughness={0.32} metalness={0.2} />
          </mesh>
          <mesh position={[-0.3, -0.34, 0.785]}>
            <cylinderGeometry args={[0.007, 0.007, 0.28, 8]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.92} roughness={0.15} />
          </mesh>

          <mesh position={[-0.42, 0.12, 0.92]} castShadow>
            <boxGeometry args={[0.58, 0.04, 0.36]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[-0.15, 0.1, 0.768]}>
            <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={0.6} roughness={0.2} />
          </mesh>

          <group position={[0.35, -0.12, 0.755]}>
            <mesh>
              <boxGeometry args={[0.58, 0.58, 0.025]} />
              <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <boxGeometry args={[0.52, 0.52, 0.015]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#0284C7"
                emissiveIntensity={0.2}
                roughness={0.12}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh position={[0, 0, 0.016]}>
              <boxGeometry args={[0.52, 0.018, 0.008]} />
              <meshStandardMaterial color="#0F172A" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.016]}>
              <boxGeometry args={[0.018, 0.52, 0.008]} />
              <meshStandardMaterial color="#0F172A" roughness={0.4} />
            </mesh>
          </group>

          <mesh position={[-0.4, 0.44, 0]} rotation={[0, 0, 0.4]} castShadow receiveShadow>
            <boxGeometry args={[0.94, 0.05, 1.66]} />
            <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.45} />
          </mesh>
          <mesh position={[0.4, 0.44, 0]} rotation={[0, 0, -0.4]} castShadow receiveShadow>
            <boxGeometry args={[0.94, 0.05, 1.66]} />
            <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.45} />
          </mesh>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.08, 0.04, 1.68]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.38, 0.74]}>
            <boxGeometry args={[1.36, 0.22, 0.02]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.38} />
          </mesh>
          <mesh position={[0, 0.38, -0.74]}>
            <boxGeometry args={[1.36, 0.22, 0.02]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.38} />
          </mesh>

          <group position={[-0.76, 0.0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.08, 0.36, 0.26]} />
              <meshStandardMaterial color="#64748B" metalness={0.82} roughness={0.25} />
            </mesh>
            <mesh position={[-0.045, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
              <meshStandardMaterial color="#BAE6FD" transparent opacity={0.65} roughness={0.12} />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.32, 12]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.2} />
            </mesh>
          </group>

          <mesh position={[-0.42, -0.77, 1.02]}>
            <boxGeometry args={[0.48, 0.04, 0.34]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.88} />
          </mesh>
        </group>
      );

    default:
      return (
        <group>
          <RoundedBox args={[0.78, 0.98, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.12} />
          </RoundedBox>
          <mesh position={[0, 0.1, 0.22]}>
            <boxGeometry args={[0.2, 0.28, 0.12]} />
            <meshStandardMaterial color="#0284C7" roughness={0.3} />
          </mesh>
        </group>
      );
  }
}
