import { ReactNode } from 'react';

function BlueprintFrame({
  gridId,
  arrowId,
  includeAmberArrow = false,
  children,
}: {
  gridId: string;
  arrowId: string;
  includeAmberArrow?: boolean;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 540 240" className="w-full h-auto max-h-56 bg-slate-950 rounded-2xl p-2 select-none">
      <defs>
        <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
        </pattern>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
        </marker>
        {includeAmberArrow && (
          <marker
            id="arrow_amber"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#F59E0B" />
          </marker>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${gridId})`} />
      {children}
    </svg>
  );
}

export function CadDimensionDrawing({ itemKey }: { itemKey: string }) {
  switch (itemKey) {
    case 'roof_rail':
      return (
        <BlueprintFrame gridId="grid_rail" arrowId="arrow_rail" includeAmberArrow>
          <g transform="translate(180, 45)">
            <path
              d="M 0,0 L 70,0 L 70,15 L 56,15 L 56,35 L 70,35 L 70,95 L 56,95 L 56,115 L 70,115 L 70,130 L 0,130 L 0,115 L 14,115 L 14,95 L 0,95 L 0,35 L 14,35 L 14,15 L 0,15 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            <path d="M 24,0 L 46,0 L 46,24 L 54,24 L 54,36 L 16,36 L 16,24 L 24,24 Z" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M 70,55 L 48,55 L 48,75 L 70,75 Z" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M 0,55 L 22,55 L 22,75 L 0,75 Z" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
            <rect x="28" y="50" width="14" height="30" rx="3" fill="#0F172A" stroke="#64748B" strokeWidth="1" />

            <line x1="0" y1="-15" x2="70" y2="-15" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_rail)" markerEnd="url(#arrow_rail)" />
            <line x1="0" y1="0" x2="0" y2="-22" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="70" y1="0" x2="70" y2="-22" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="35" y="-20" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">28.0 mm</text>

            <line x1="-25" y1="0" x2="-25" y2="130" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_rail)" markerEnd="url(#arrow_rail)" />
            <line x1="0" y1="0" x2="-32" y2="0" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="0" y1="130" x2="-32" y2="130" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-35" y="70" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -35, 70)" fontWeight="bold">40.0 mm</text>

            <line x1="24" y1="18" x2="46" y2="18" stroke="#F59E0B" strokeWidth="1.2" markerStart="url(#arrow_amber)" markerEnd="url(#arrow_amber)" />
            <text x="35" y="14" fill="#F59E0B" fontSize="9" fontFamily="monospace" textAnchor="middle">14.0 mm</text>
          </g>

          <g transform="translate(320, 70)">
            <rect x="0" y="0" width="190" height="95" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="15" y="24" fill="#F8FAFC" fontSize="11" fontFamily="monospace" fontWeight="bold">CAD SPECIFICATIONS</text>
            <text x="15" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Extruded Length: <tspan fill="#38BDF8">2200 mm</tspan></text>
            <text x="15" y="60" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Wall Thickness: <tspan fill="#38BDF8">1.3 mm (t)</tspan></text>
            <text x="15" y="76" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Structural Alloy: <tspan fill="#F59E0B">AL6005-T5</tspan></text>
          </g>
        </BlueprintFrame>
      );

    case 'rail_splice':
      return (
        <BlueprintFrame gridId="grid_splice" arrowId="arrow_splice">
          <g transform="translate(60, 60)">
            <rect x="0" y="20" width="280" height="65" rx="4" fill="#1E293B" stroke="#F8FAFC" strokeWidth="2" />
            <rect x="0" y="14" width="280" height="8" rx="2" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
            <rect x="0" y="83" width="280" height="8" rx="2" fill="#334155" stroke="#94A3B8" strokeWidth="1" />

            <rect x="138" y="10" width="4" height="85" fill="#F59E0B" />
            <text x="140" y="112" fill="#F59E0B" fontSize="9" fontFamily="monospace" textAnchor="middle">10mm Expansion Gap</text>

            <circle cx="35" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="95" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="185" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="245" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />

            <line x1="0" y1="-5" x2="280" y2="-5" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_splice)" markerEnd="url(#arrow_splice)" />
            <line x1="0" y1="14" x2="0" y2="-12" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="280" y1="14" x2="280" y2="-12" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="140" y="-10" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">150.0 mm</text>

            <line x1="-15" y1="14" x2="-15" y2="91" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_splice)" markerEnd="url(#arrow_splice)" />
            <line x1="0" y1="14" x2="-22" y2="14" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="0" y1="91" x2="-22" y2="91" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-25" y="55" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -25, 55)" fontWeight="bold">32 mm</text>
          </g>

          <g transform="translate(370, 60)">
            <rect x="0" y="0" width="145" height="110" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="12" y="24" fill="#F8FAFC" fontSize="11" fontFamily="monospace" fontWeight="bold">FASTENER MATRIX</text>
            <text x="12" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Bolts: <tspan fill="#38BDF8">4× M6 SS304</tspan></text>
            <text x="12" y="60" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Thickness: <tspan fill="#38BDF8">2.0 mm</tspan></text>
            <text x="12" y="76" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Torque: <tspan fill="#F59E0B">9–12 N·m</tspan></text>
            <text x="12" y="94" fill="#10B981" fontSize="9" fontFamily="monospace">Equipotential Bonded</text>
          </g>
        </BlueprintFrame>
      );

    case 'l_foot':
      return (
        <BlueprintFrame gridId="grid_lfoot" arrowId="arrow_lfoot">
          <g transform="translate(100, 35)">
            <path
              d="M 0,0 L 28,0 L 28,110 L 100,110 L 100,135 L 0,135 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            <rect x="-4" y="135" width="108" height="12" rx="2" fill="#0F172A" stroke="#64748B" strokeWidth="1.2" />
            <text x="50" y="144" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">EPDM Gasket (3mm)</text>

            <rect x="8" y="25" width="12" height="55" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="14" y="55" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, 14, 55)">Ø8.5mm Slot</text>

            <ellipse cx="65" cy="122" rx="7" ry="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />

            <line x1="-20" y1="0" x2="-20" y2="135" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_lfoot)" markerEnd="url(#arrow_lfoot)" />
            <line x1="0" y1="0" x2="-28" y2="0" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="0" y1="135" x2="-28" y2="135" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-32" y="70" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -32, 70)" fontWeight="bold">84.0 mm</text>

            <line x1="0" y1="160" x2="100" y2="160" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_lfoot)" markerEnd="url(#arrow_lfoot)" />
            <line x1="0" y1="147" x2="0" y2="168" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="100" y1="147" x2="100" y2="168" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="50" y="174" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">40.0 mm Base</text>
          </g>

          <g transform="translate(280, 50)">
            <rect x="0" y="0" width="220" height="115" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="14" y="24" fill="#F8FAFC" fontSize="11" fontFamily="monospace" fontWeight="bold">TOLERANCES &amp; FASTENERS</text>
            <text x="14" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Extrusion: <tspan fill="#38BDF8">5.0 mm Solid Wall</tspan></text>
            <text x="14" y="60" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Rail Attachment: <tspan fill="#38BDF8">M8 T-Bolt (18 N·m)</tspan></text>
            <text x="14" y="76" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Rafter Penetration: <tspan fill="#38BDF8">6.3×80mm Lag</tspan></text>
            <text x="14" y="94" fill="#10B981" fontSize="9" fontFamily="monospace">UL 2703 &amp; AS/NZS 1170.2 Tested</text>
          </g>
        </BlueprintFrame>
      );

    case 'mid_clamp':
      return (
        <BlueprintFrame gridId="grid_mid" arrowId="arrow_mid">
          <g transform="translate(100, 50)">
            <path
              d="M 0,35 L 35,35 L 35,0 L 75,0 L 75,35 L 110,35 L 110,50 L 75,50 L 75,70 L 35,70 L 35,50 L 0,50 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            <rect x="47" y="-20" width="16" height="30" rx="3" fill="#38BDF8" opacity="0.3" stroke="#38BDF8" strokeWidth="1" />
            <line x1="55" y1="-25" x2="55" y2="85" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 2" />
            <text x="55" y="-30" fill="#F59E0B" fontSize="9" fontFamily="monospace" textAnchor="middle">M8 × 45 mm Centerline</text>

            <g transform="translate(55, 65)">
              <circle cx="0" cy="0" r="14" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="2 2" />
              <text x="0" y="24" fill="#F59E0B" fontSize="8" fontFamily="monospace" textAnchor="middle">UL 467 Ground Washer</text>
            </g>

            <line x1="0" y1="85" x2="110" y2="85" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_mid)" markerEnd="url(#arrow_mid)" />
            <line x1="0" y1="50" x2="0" y2="92" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="110" y1="50" x2="110" y2="92" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="55" y="100" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">40.0 mm Clamping Span</text>

            <line x1="-15" y1="0" x2="-15" y2="50" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_mid)" markerEnd="url(#arrow_mid)" />
            <text x="-25" y="28" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -25, 28)">28 mm</text>
          </g>

          <g transform="translate(290, 50)">
            <rect x="0" y="0" width="210" height="115" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="14" y="24" fill="#F8FAFC" fontSize="11" fontFamily="monospace" fontWeight="bold">CAD SPECIFICATIONS</text>
            <text x="14" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Frame Fit: <tspan fill="#38BDF8">30–40 mm Modules</tspan></text>
            <text x="14" y="60" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Hardware: <tspan fill="#38BDF8">M8 Hex Cap + T-Nut</tspan></text>
            <text x="14" y="76" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Tightening: <tspan fill="#F59E0B">15–18 N·m</tspan></text>
            <text x="14" y="94" fill="#10B981" fontSize="9" fontFamily="monospace">Anodize Piercing Bonding</text>
          </g>
        </BlueprintFrame>
      );

    case 'end_clamp':
      return (
        <BlueprintFrame gridId="grid_end" arrowId="arrow_end">
          <g transform="translate(100, 50)">
            <path
              d="M 0,25 L 35,25 L 35,0 L 85,0 L 85,75 L 0,75 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            <line x1="0" y1="32" x2="35" y2="32" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="18" y="44" fill="#F59E0B" fontSize="8" fontFamily="monospace" textAnchor="middle">Grip Teeth</text>

            <rect x="52" y="-18" width="16" height="26" rx="3" fill="#38BDF8" opacity="0.3" stroke="#38BDF8" strokeWidth="1" />
            <line x1="60" y1="-25" x2="60" y2="90" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 2" />

            <line x1="0" y1="15" x2="35" y2="15" stroke="#38BDF8" strokeWidth="1.2" markerStart="url(#arrow_end)" markerEnd="url(#arrow_end)" />
            <text x="18" y="10" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle">15 mm Lip</text>

            <line x1="-15" y1="0" x2="-15" y2="75" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_end)" markerEnd="url(#arrow_end)" />
            <line x1="0" y1="0" x2="-22" y2="0" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="0" y1="75" x2="-22" y2="75" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-25" y="40" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -25, 40)" fontWeight="bold">38 mm</text>

            <line x1="0" y1="90" x2="85" y2="90" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_end)" markerEnd="url(#arrow_end)" />
            <text x="42" y="105" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">40.0 mm Width</text>
          </g>

          <g transform="translate(280, 50)">
            <rect x="0" y="0" width="220" height="115" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="14" y="24" fill="#F8FAFC" fontSize="11" fontFamily="monospace" fontWeight="bold">CAD SPECIFICATIONS</text>
            <text x="14" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Step Profile: <tspan fill="#38BDF8">30/35/40 mm Heights</tspan></text>
            <text x="14" y="60" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Fastener: <tspan fill="#38BDF8">M8×30 mm SS304</tspan></text>
            <text x="14" y="76" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Torque: <tspan fill="#F59E0B">15–18 N·m</tspan></text>
            <text x="14" y="94" fill="#10B981" fontSize="9" fontFamily="monospace">Wind Uplift ≥ 3.5 kN</text>
          </g>
        </BlueprintFrame>
      );

    case 'grounding_lug':
    default:
      return (
        <BlueprintFrame gridId="grid_lug" arrowId="arrow_lug">
          <g transform="translate(60, 45)">
            <rect x="0" y="20" width="90" height="65" rx="4" fill="#1E293B" stroke="#F8FAFC" strokeWidth="2" />
            <circle cx="35" cy="52" r="14" fill="#0F172A" stroke="#F97316" strokeWidth="2" />
            <text x="35" y="56" fill="#F97316" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">14-4 AWG</text>

            <circle cx="70" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="70" y="74" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle">Ø8.5mm</text>

            <path
              d="M 90,45 C 140,10 190,10 240,45"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
            <circle cx="240" cy="45" r="9" fill="#1E293B" stroke="#F8FAFC" strokeWidth="1.5" />
            <circle cx="240" cy="45" r="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <text x="165" y="14" fill="#F59E0B" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">150 mm Braided Stainless Strap</text>

            <line x1="0" y1="5" x2="90" y2="5" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_lug)" markerEnd="url(#arrow_lug)" />
            <text x="45" y="-2" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">32.0 mm Lug Body</text>

            <line x1="-15" y1="20" x2="-15" y2="85" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_lug)" markerEnd="url(#arrow_lug)" />
            <text x="-25" y="55" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -25, 55)">24 mm</text>
          </g>

          <g transform="translate(330, 45)">
            <rect x="0" y="0" width="185" height="120" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="14" y="24" fill="#F8FAFC" fontSize="11" fontFamily="monospace" fontWeight="bold">ELECTRICAL BONDING</text>
            <text x="14" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Material: <tspan fill="#38BDF8">Tinned Copper</tspan></text>
            <text x="14" y="60" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Wire Size: <tspan fill="#38BDF8">14 to 4 AWG Cu</tspan></text>
            <text x="14" y="76" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Lug Torque: <tspan fill="#F59E0B">8–10 N·m</tspan></text>
            <text x="14" y="92" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Rail Bolt: <tspan fill="#F59E0B">15 N·m (M8)</tspan></text>
            <text x="14" y="108" fill="#10B981" fontSize="9" fontFamily="monospace">UL 467 &amp; NEC 690.43</text>
          </g>
        </BlueprintFrame>
      );
  }
}
