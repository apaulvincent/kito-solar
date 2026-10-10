// src/components/results/MountingBomCard.tsx
import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Hammer, Info, Maximize2, X, ShieldCheck, Wrench, Ruler, Award } from 'lucide-react';
import { MountingItem } from '@/types/calculator';

interface TechnicalSpecDetail {
  dimensions: string;
  material: string;
  hardware: string;
  torque: string;
  loadRating: string;
  corrosion: string;
  standard: string;
}

const ACCESSORY_TECHNICAL_DATA: Record<string, TechnicalSpecDetail> = {
  roof_rail: {
    dimensions: '2200 × 28 × 40 mm (Length × Width × Height), 1.3 mm wall profile',
    material: 'High-Tensile Structural Aluminum Alloy (AL6005-T5)',
    hardware: 'Compatible with standard M8 T-bolts, mid clamps, and end clamps',
    torque: '15–18 N·m (L-foot attachment)',
    loadRating: 'Wind Load: up to 60 m/s | Snow Load: up to 1.4 kN/m²',
    corrosion: 'Clear anodized surface finish, film thickness ≥ 10 µm',
    standard: 'AS/NZS 1170.2, UL 2703, Eurocode 9, ISO 9001 certified',
  },
  rail_splice: {
    dimensions: '150 × 22 × 32 mm internal slide-in structural connector bar',
    material: 'AL6005-T5 High-Strength Extrusion + SUS304 Grounding Bonding Pins',
    hardware: '2× M6 SUS304 Hex Socket Bolts + Grounding Pins',
    torque: '9–12 N·m (fastener torque)',
    loadRating: 'Bending Moment Capacity: 95% of uninterrupted rail section',
    corrosion: 'Internal hidden mounting protects fasteners from weather exposure',
    standard: 'UL 2703 Equipotential Bonding, IEC 61215, IBC 2021',
  },
  l_foot: {
    dimensions: '84 × 40 × 40 mm (Height × Base Width × Depth), 5.0 mm thickness',
    material: 'Anodized Aluminum AL6005-T5 with 3.0 mm EPDM isolation pad',
    hardware: 'M8 × 25 mm SUS304 Hex Flange Bolt, Spring Washer, 6.3×80 mm Lag Bolt',
    torque: '15–18 N·m (M8) / 10–12 N·m (Lag bolt into purlin)',
    loadRating: 'Uplift Resistance: ≥ 3.8 kN per bracket point',
    corrosion: 'UV-resistant vulcanized EPDM gasket prevents galvanic corrosion',
    standard: 'UL 2703, AS/NZS 1170.2, CE approved',
  },
  mid_clamp: {
    dimensions: '40 × 35 × 28 mm clamping plate, fits 30–40 mm module frame heights',
    material: 'Anodized Extruded Aluminum AL6005-T5 + SUS304 Grounding Star Clip',
    hardware: 'M8 × 45 mm Socket Head Cap Screw (Hex 6 mm drive), Stainless Washer, T-Nut',
    torque: '15–18 N·m (ensures frame grounding continuity)',
    loadRating: 'Clamping Force: ≥ 4.2 kN per module interface',
    corrosion: 'Dual grounding teeth pierce frame anodization for UL 467 bonding',
    standard: 'UL 467, UL 2703 Class A fire & grounding certified',
  },
  end_clamp: {
    dimensions: '40 × 35 × 38 mm clamping jaw, stepped Z-profile matching frame height',
    material: 'Anodized Aluminum AL6005-T5 with grooved anti-slip gripping face',
    hardware: 'M8 × 30 mm SUS304 Socket Head Cap Screw & Aluminum T-Nut slider',
    torque: '15–18 N·m',
    loadRating: 'Edge Wind Uplift Resistance: ≥ 3.5 kN',
    corrosion: 'Salt spray resistance > 1000 hours per ASTM B117',
    standard: 'AS/NZS 1170.2, UL 2703 Class A, TUV Rheinland certified',
  },
  grounding_lug: {
    dimensions: '32 × 16 × 24 mm (Lug Body) | 150 × 20 mm Braided Stainless Strap',
    material: 'High-Conductivity Tin-Plated Copper (Lug) & SUS304 Stainless Steel (Jumper)',
    hardware: 'M8 SUS304 Hex Bolt & Serrated Flange Nut (Rail) + M6 SS Bolt (Jumper) + Hex Set Screw',
    torque: '8–10 N·m (terminal clamp wire screw) | 15–18 N·m (M8 rail bolt)',
    loadRating: 'Short-Circuit Fault Current: 5000 A for 5 sec (UL 467) | Wire: 14 AWG to 4 AWG',
    corrosion: 'Electro-tin plating eliminates galvanic reaction between copper conductor and aluminum rail',
    standard: 'UL 467 Grounding/Bonding, UL 2703 Class A, NEC 690.43 compliant',
  },
  mc4: {
    dimensions: '58 × 19 mm (mated pair length: ~88 mm), cable OD 4.0–6.0 mm²',
    material: 'Flame Retardant PPO/PC (UL94-V0) with tinned copper contact pins',
    hardware: 'Snap-in locking mechanism, silicone internal sealing gasket',
    torque: '2.5–3.0 N·m on compression sealing nut gland',
    loadRating: 'Nominal Voltage: 1500 V DC | Rated Current: 30–45 A continuous',
    corrosion: 'IP68 waterproof rating (1m immersion for 24h), UV resistant',
    standard: 'IEC 62852:2014, UL 6703 certified',
  },
};

function CadDimensionDrawing({ itemKey }: { itemKey: string }) {
  switch (itemKey) {
    case 'roof_rail':
      return (
        <svg viewBox="0 0 540 240" className="w-full h-auto max-h-56 bg-slate-950 rounded-2xl p-2 select-none">
          <defs>
            <pattern id="grid_rail" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            <marker id="arrow_rail" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
            <marker id="arrow_amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#F59E0B" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid_rail)" />
          
          {/* Rail Cross Section CAD Outline */}
          <g transform="translate(180, 45)">
            {/* Outer Perimeter */}
            <path
              d="M 0,0 L 70,0 L 70,15 L 56,15 L 56,35 L 70,35 L 70,95 L 56,95 L 56,115 L 70,115 L 70,130 L 0,130 L 0,115 L 14,115 L 14,95 L 0,95 L 0,35 L 14,35 L 14,15 L 0,15 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* Top T-Slot Cavity */}
            <path d="M 24,0 L 46,0 L 46,24 L 54,24 L 54,36 L 16,36 L 16,24 L 24,24 Z" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
            {/* Side Channels */}
            <path d="M 70,55 L 48,55 L 48,75 L 70,75 Z" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M 0,55 L 22,55 L 22,75 L 0,75 Z" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
            {/* Center Cavity */}
            <rect x="28" y="50" width="14" height="30" rx="3" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
            
            {/* Width Dimension: 28 mm */}
            <line x1="0" y1="-15" x2="70" y2="-15" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_rail)" markerEnd="url(#arrow_rail)" />
            <line x1="0" y1="0" x2="0" y2="-22" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="70" y1="0" x2="70" y2="-22" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="35" y="-20" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">28.0 mm</text>

            {/* Height Dimension: 40 mm */}
            <line x1="-25" y1="0" x2="-25" y2="130" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_rail)" markerEnd="url(#arrow_rail)" />
            <line x1="0" y1="0" x2="-32" y2="0" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="0" y1="130" x2="-32" y2="130" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-35" y="70" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -35, 70)" fontWeight="bold">40.0 mm</text>

            {/* Top T-Slot Opening: 14 mm */}
            <line x1="24" y1="18" x2="46" y2="18" stroke="#F59E0B" strokeWidth="1.2" markerStart="url(#arrow_amber)" markerEnd="url(#arrow_amber)" />
            <text x="35" y="14" fill="#F59E0B" fontSize="9" fontFamily="monospace" textAnchor="middle">14.0 mm</text>
          </g>

          {/* Longitudinal Callouts */}
          <g transform="translate(320, 70)">
            <rect x="0" y="0" width="190" height="95" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="15" y="24" fill="#F8FAFC" fontSize="11" fontFamily="monospace" fontWeight="bold">CAD SPECIFICATIONS</text>
            <text x="15" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Extruded Length: <tspan fill="#38BDF8">2200 mm</tspan></text>
            <text x="15" y="60" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Wall Thickness: <tspan fill="#38BDF8">1.3 mm (t)</tspan></text>
            <text x="15" y="76" fill="#94A3B8" fontSize="10" fontFamily="monospace">• Structural Alloy: <tspan fill="#F59E0B">AL6005-T5</tspan></text>
          </g>
        </svg>
      );

    case 'rail_splice':
      return (
        <svg viewBox="0 0 540 240" className="w-full h-auto max-h-56 bg-slate-950 rounded-2xl p-2 select-none">
          <defs>
            <pattern id="grid_splice" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            <marker id="arrow_splice" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid_splice)" />
          
          <g transform="translate(60, 60)">
            {/* Splice Bar Profile */}
            <rect x="0" y="20" width="280" height="65" rx="4" fill="#1E293B" stroke="#F8FAFC" strokeWidth="2" />
            <rect x="0" y="14" width="280" height="8" rx="2" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
            <rect x="0" y="83" width="280" height="8" rx="2" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
            
            {/* Central Thermal Expansion Rib */}
            <rect x="138" y="10" width="4" height="85" fill="#F59E0B" />
            <text x="140" y="112" fill="#F59E0B" fontSize="9" fontFamily="monospace" textAnchor="middle">10mm Expansion Gap</text>

            {/* 4 Fastener Holes with Pitch Callouts */}
            <circle cx="35" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="95" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="185" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="245" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />

            {/* 150mm Length Dimension */}
            <line x1="0" y1="-5" x2="280" y2="-5" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_splice)" markerEnd="url(#arrow_splice)" />
            <line x1="0" y1="14" x2="0" y2="-12" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="280" y1="14" x2="280" y2="-12" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="140" y="-10" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">150.0 mm</text>

            {/* 32mm Height Dimension */}
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
        </svg>
      );

    case 'l_foot':
      return (
        <svg viewBox="0 0 540 240" className="w-full h-auto max-h-56 bg-slate-950 rounded-2xl p-2 select-none">
          <defs>
            <pattern id="grid_lfoot" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            <marker id="arrow_lfoot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid_lfoot)" />
          
          <g transform="translate(100, 35)">
            {/* L-Foot Bracket Outline */}
            <path
              d="M 0,0 L 28,0 L 28,110 L 100,110 L 100,135 L 0,135 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* EPDM Rubber Isolation Pad */}
            <rect x="-4" y="135" width="108" height="12" rx="2" fill="#0F172A" stroke="#64748B" strokeWidth="1.2" />
            <text x="50" y="144" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">EPDM Gasket (3mm)</text>

            {/* Vertical Adjustment Slot (Upper) */}
            <rect x="8" y="25" width="12" height="55" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="14" y="55" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, 14, 55)">Ø8.5mm Slot</text>

            {/* Base Lag Hole */}
            <ellipse cx="65" cy="122" rx="7" ry="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />

            {/* Height Dimension: 84 mm */}
            <line x1="-20" y1="0" x2="-20" y2="135" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_lfoot)" markerEnd="url(#arrow_lfoot)" />
            <line x1="0" y1="0" x2="-28" y2="0" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="0" y1="135" x2="-28" y2="135" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-32" y="70" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -32, 70)" fontWeight="bold">84.0 mm</text>

            {/* Base Width Dimension: 40 mm */}
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
        </svg>
      );

    case 'mid_clamp':
      return (
        <svg viewBox="0 0 540 240" className="w-full h-auto max-h-56 bg-slate-950 rounded-2xl p-2 select-none">
          <defs>
            <pattern id="grid_mid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            <marker id="arrow_mid" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid_mid)" />
          
          <g transform="translate(100, 50)">
            {/* Clamping T-Section Wings */}
            <path
              d="M 0,35 L 35,35 L 35,0 L 75,0 L 75,35 L 110,35 L 110,50 L 75,50 L 75,70 L 35,70 L 35,50 L 0,50 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* M8 Central Bolt Channel */}
            <rect x="47" y="-20" width="16" height="30" rx="3" fill="#38BDF8" opacity="0.3" stroke="#38BDF8" strokeWidth="1" />
            <line x1="55" y1="-25" x2="55" y2="85" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 2" />
            <text x="55" y="-30" fill="#F59E0B" fontSize="9" fontFamily="monospace" textAnchor="middle">M8 × 45 mm Centerline</text>

            {/* Star Grounding Washer Teeth Impression */}
            <g transform="translate(55, 65)">
              <circle cx="0" cy="0" r="14" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="2 2" />
              <text x="0" y="24" fill="#F59E0B" fontSize="8" fontFamily="monospace" textAnchor="middle">UL 467 Ground Washer</text>
            </g>

            {/* Overall Width: 40 mm */}
            <line x1="0" y1="85" x2="110" y2="85" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_mid)" markerEnd="url(#arrow_mid)" />
            <line x1="0" y1="50" x2="0" y2="92" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="110" y1="50" x2="110" y2="92" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="55" y="100" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">40.0 mm Clamping Span</text>

            {/* Module Lip Height Range: 30-40mm */}
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
        </svg>
      );

    case 'end_clamp':
      return (
        <svg viewBox="0 0 540 240" className="w-full h-auto max-h-56 bg-slate-950 rounded-2xl p-2 select-none">
          <defs>
            <pattern id="grid_end" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            <marker id="arrow_end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid_end)" />
          
          <g transform="translate(100, 50)">
            {/* Stepped End Clamp Z-Profile */}
            <path
              d="M 0,25 L 35,25 L 35,0 L 85,0 L 85,75 L 0,75 Z"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* Serrated Gripping Jaw */}
            <line x1="0" y1="32" x2="35" y2="32" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="18" y="44" fill="#F59E0B" fontSize="8" fontFamily="monospace" textAnchor="middle">Grip Teeth</text>

            {/* M8 Bolt Hole Center */}
            <rect x="52" y="-18" width="16" height="26" rx="3" fill="#38BDF8" opacity="0.3" stroke="#38BDF8" strokeWidth="1" />
            <line x1="60" y1="-25" x2="60" y2="90" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 2" />

            {/* Clamping Lip: 15 mm */}
            <line x1="0" y1="15" x2="35" y2="15" stroke="#38BDF8" strokeWidth="1.2" markerStart="url(#arrow_end)" markerEnd="url(#arrow_end)" />
            <text x="18" y="10" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle">15 mm Lip</text>

            {/* Step Height Dimension: 38 mm */}
            <line x1="-15" y1="0" x2="-15" y2="75" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_end)" markerEnd="url(#arrow_end)" />
            <line x1="0" y1="0" x2="-22" y2="0" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="0" y1="75" x2="-22" y2="75" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-25" y="40" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, -25, 40)" fontWeight="bold">38 mm</text>

            {/* Base Length: 40 mm */}
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
        </svg>
      );

    case 'grounding_lug':
    default:
      return (
        <svg viewBox="0 0 540 240" className="w-full h-auto max-h-56 bg-slate-950 rounded-2xl p-2 select-none">
          <defs>
            <pattern id="grid_lug" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            <marker id="arrow_lug" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid_lug)" />
          
          <g transform="translate(60, 45)">
            {/* Tin-Plated Grounding Lug Elevation */}
            <rect x="0" y="20" width="90" height="65" rx="4" fill="#1E293B" stroke="#F8FAFC" strokeWidth="2" />
            {/* Lay-in Wire Duct Hole */}
            <circle cx="35" cy="52" r="14" fill="#0F172A" stroke="#F97316" strokeWidth="2" />
            <text x="35" y="56" fill="#F97316" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">14-4 AWG</text>

            {/* M8 Rail Fastener Hole */}
            <circle cx="70" cy="52" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="70" y="74" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle">Ø8.5mm</text>

            {/* 150mm Braided Bonding Jumper Strap Arc */}
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

            {/* Length: 32 mm */}
            <line x1="0" y1="5" x2="90" y2="5" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow_lug)" markerEnd="url(#arrow_lug)" />
            <text x="45" y="-2" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">32.0 mm Lug Body</text>

            {/* Height: 24 mm */}
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
        </svg>
      );
  }
}

export function MountingBomCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const { mounting } = calculationResult;
  const [inspectedItem, setInspectedItem] = useState<MountingItem | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedItem(null);
      }
    };

    if (inspectedItem) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [inspectedItem]);

  const activeSpecs = inspectedItem
    ? ACCESSORY_TECHNICAL_DATA[inspectedItem.key] || ACCESSORY_TECHNICAL_DATA.roof_rail
    : null;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card dark:shadow-card-dark space-y-6 transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                BILL OF MATERIALS (BOM) &amp; MECHANICAL SPECS
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Roof Mounting Hardware ({mounting.panelCount} Modules Array)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 font-semibold">
              AL6005-T5 / SUS304
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold">
              WIND LOAD: 60 M/S
            </span>
          </div>
        </div>

        {/* 6 High-Fidelity Accessory Cards Grid (Unconstrained, Zero Truncation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mounting.items.map((item) => (
            <div
              key={item.key}
              onClick={() => setInspectedItem(item)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer space-y-4"
            >
              <div className="space-y-3">
                {/* Visual Preview Box & Primary Quantities */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex-shrink-0 flex items-center justify-center p-2 overflow-hidden shadow-subtle group-hover:scale-105 group-hover:border-amber-400/60 transition-transform">
                    <img
                      src={item.imagePath}
                      alt={item.name}
                      className="w-full h-full object-contain filter drop-shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = item.imagePath.replace('.webp', '.svg');
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                        {item.key.toUpperCase().replace('_', ' ')}
                      </span>
                      <button
                        type="button"
                        className="text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors p-1"
                        title="Click to inspect CAD specifications and engineering tolerances"
                        aria-label={`Inspect ${item.name} CAD specifications`}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                      {item.name}
                    </h4>

                    <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-baseline gap-1.5">
                      <span>{item.quantity}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase font-sans">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dimension & Material Quick Tag */}
                {item.dimensions && (
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                      {item.dimensions.lengthMm} × {item.dimensions.widthMm} × {item.dimensions.heightMm} mm
                    </span>
                    {item.dimensions.torqueNm && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                        Torque: {item.dimensions.torqueNm}
                      </span>
                    )}
                  </div>
                )}

                {/* Specification Box (No text truncation) */}
                <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed shadow-subtle">
                  {item.specification}
                </div>

                {/* Engineering Explanation (Full unconstrained text) */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.explanation}
                </p>
              </div>

              {/* Card Footer: Sizing Basis & CAD Action */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                {/* Engineering Sizing Basis */}
                <div className="flex items-start gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{item.calculationBasis}</span>
                </div>

                {/* Inspect CAD Dimensions Trigger Button */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.standards?.slice(0, 2).map((std) => (
                      <span key={std} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 font-medium">
                        {std}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedItem(item);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-300 transition-colors shadow-sm"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Inspect CAD Dimensions</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical CAD Specification Modal Drawer */}
      {inspectedItem && activeSpecs && (
        <div
          onClick={() => setInspectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cad-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm flex items-center justify-center">
                  <img
                    src={inspectedItem.imagePath}
                    alt={inspectedItem.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = inspectedItem.imagePath.replace('.webp', '.svg');
                    }}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                    ENGINEERING CAD BLUEPRINT &amp; DIMENSIONAL SPECS
                  </span>
                  <h3 id="cad-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                    {inspectedItem.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setInspectedItem(null)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
                aria-label="Close CAD Inspection dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
              {/* Interactive CAD Blueprint Drawing Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-500" />
                    Dimensional CAD Schematic Blueprint
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Units: Millimeters (mm)
                  </span>
                </div>
                
                {/* Embedded CAD Dimension Schematic */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                  <CadDimensionDrawing itemKey={inspectedItem.key} />
                </div>
              </div>

              {/* Labeled Millimeter Dimensions Metrics Grid */}
              {inspectedItem.dimensions && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Measured Millimeter Dimensions
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Length</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.lengthMm} mm
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Width / Flange</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.widthMm} mm
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Height / Depth</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.heightMm} mm
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Wall Thickness</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.thicknessMm} mm
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantities & Formula Summary */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                <div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase font-bold block">
                    REQUIRED QUANTITY
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {inspectedItem.quantity}{' '}
                    <span className="text-xs font-normal text-slate-500 uppercase">{inspectedItem.unit}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase font-bold block">
                    SYSTEM ARRAY ALLOCATION
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white block mt-1">
                    {mounting.panelCount} Solar Modules Total
                  </span>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Engineering Specifications &amp; Standards
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Dimensions &amp; Profile</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {activeSpecs.dimensions}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Alloy &amp; Composition</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {inspectedItem.material ?? activeSpecs.material}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Fastener Hardware</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {inspectedItem.dimensions?.fastenerSpec ?? activeSpecs.hardware}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Tightening Torque</span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                      {inspectedItem.dimensions?.torqueNm ?? activeSpecs.torque}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Wind / Snow Load Capacity</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {activeSpecs.loadRating}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Corrosion Protection</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {inspectedItem.finish ?? activeSpecs.corrosion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sizing Logic & Compliance Standards */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Engineering Sizing Basis &amp; Structural Codes</span>
                </div>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
                  {inspectedItem.calculationBasis}
                </p>
                
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">Certified Standards:</span>
                  {(inspectedItem.standards ?? [activeSpecs.standard]).map((std) => (
                    <span key={std} className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                      {std}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setInspectedItem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-white transition-colors shadow-subtle"
              >
                Close CAD Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
