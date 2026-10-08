// scripts/generate-accessory-assets.js
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/assets/accessories');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const assets = [
  {
    name: 'pv-dc-breaker',
    title: 'DC 2-POLE MCB',
    type: 'PROTECTION',
    sub: '500V - 1000V DC',
    accent: '#F59E0B',
    icon: `<rect x="55" y="30" width="90" height="140" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
           <rect x="75" y="45" width="50" height="40" rx="4" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <rect x="85" y="55" width="30" height="20" rx="2" fill="#EF4444"/>
           <line x1="100" y1="95" x2="100" y2="125" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
           <circle cx="100" cy="140" r="6" fill="#10B981"/>
           <text x="100" y="160" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">DIN RAIL 2P</text>`
  },
  {
    name: 'dc-isolator',
    title: 'DC ROTARY ISOLATOR',
    type: 'ISOLATION',
    sub: '1000V 32A-63A 4P',
    accent: '#F59E0B',
    icon: `<rect x="50" y="30" width="100" height="140" rx="10" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
           <circle cx="100" cy="95" r="32" fill="#0F172A" stroke="#64748B" stroke-width="2"/>
           <rect x="94" y="68" width="12" height="40" rx="3" fill="#EF4444"/>
           <circle cx="100" cy="95" r="8" fill="#F59E0B"/>
           <text x="100" y="152" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">IP66 LOCKABLE</text>`
  },
  {
    name: 'dc-spd',
    title: 'DC SURGE PROTECTOR',
    type: 'PROTECTION',
    sub: 'TYPE 2 / 600V-1000V',
    accent: '#F59E0B',
    icon: `<rect x="55" y="30" width="90" height="140" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
           <rect x="68" y="45" width="28" height="60" rx="3" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <rect x="104" y="45" width="28" height="60" rx="3" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <rect x="74" y="60" width="16" height="10" fill="#10B981" rx="2"/>
           <rect x="110" y="60" width="16" height="10" fill="#10B981" rx="2"/>
           <path d="M96 120 L104 120 L94 135 L106 135 L96 150" stroke="#F59E0B" stroke-width="2" fill="none"/>
           <text x="100" y="162" text-anchor="middle" fill="#94A3B8" font-size="8" font-family="monospace">Uc 600V-1000V</text>`
  },
  {
    name: 'ac-breaker',
    title: 'AC MINIATURE CB',
    type: 'PROTECTION',
    sub: '230V/400V 10kA',
    accent: '#38BDF8',
    icon: `<rect x="55" y="30" width="90" height="140" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
           <rect x="75" y="45" width="50" height="40" rx="4" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <rect x="85" y="55" width="30" height="20" rx="2" fill="#38BDF8"/>
           <line x1="100" y1="95" x2="100" y2="125" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
           <text x="100" y="148" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">CURVE C / 2P</text>`
  },
  {
    name: 'ac-isolator',
    title: 'AC DISCONNECT SWITCH',
    type: 'ISOLATION',
    sub: 'AC-22A 415V',
    accent: '#38BDF8',
    icon: `<rect x="50" y="30" width="100" height="140" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
           <circle cx="100" cy="95" r="30" fill="#0F172A" stroke="#64748B" stroke-width="2"/>
           <rect x="94" y="70" width="12" height="35" rx="3" fill="#E2E8F0"/>
           <circle cx="100" cy="95" r="7" fill="#38BDF8"/>
           <text x="100" y="150" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">MANUAL ROTARY</text>`
  },
  {
    name: 'ac-spd',
    title: 'AC SURGE ARRESTER',
    type: 'PROTECTION',
    sub: 'TYPE 2 / 275V-440V',
    accent: '#38BDF8',
    icon: `<rect x="55" y="30" width="90" height="140" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
           <rect x="68" y="45" width="28" height="60" rx="3" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <rect x="104" y="45" width="28" height="60" rx="3" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <rect x="74" y="60" width="16" height="10" fill="#10B981" rx="2"/>
           <rect x="110" y="60" width="16" height="10" fill="#10B981" rx="2"/>
           <path d="M96 120 L104 120 L94 135 L106 135 L96 150" stroke="#38BDF8" stroke-width="2" fill="none"/>
           <text x="100" y="162" text-anchor="middle" fill="#94A3B8" font-size="8" font-family="monospace">Uc 440V L-N/PE</text>`
  },
  {
    name: 'ats',
    title: 'AUTO TRANSFER SWITCH',
    type: 'TRANSFER',
    sub: 'DUAL POWER 2P/4P',
    accent: '#A855F7',
    icon: `<rect x="40" y="30" width="120" height="140" rx="10" fill="#1E293B" stroke="#A855F7" stroke-width="2"/>
           <rect x="55" y="50" width="40" height="35" rx="4" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <rect x="105" y="50" width="40" height="35" rx="4" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <circle cx="75" cy="67" r="4" fill="#10B981"/>
           <circle cx="125" cy="67" r="4" fill="#EF4444"/>
           <rect x="85" y="100" width="30" height="25" rx="4" fill="#334155"/>
           <text x="100" y="117" text-anchor="middle" fill="#F8FAFC" font-size="8" font-weight="bold" font-family="monospace">AUTO</text>
           <text x="100" y="152" text-anchor="middle" fill="#94A3B8" font-size="8" font-family="monospace">< 50ms TRANSFER</text>`
  },
  {
    name: 'battery-breaker',
    title: 'BATTERY DC MCCB',
    type: 'PROTECTION',
    sub: 'HIGH-AMP 100A-400A',
    accent: '#10B981',
    icon: `<rect x="45" y="30" width="110" height="140" rx="10" fill="#1E293B" stroke="#10B981" stroke-width="2"/>
           <rect x="65" y="50" width="70" height="50" rx="6" fill="#0F172A" stroke="#475569" stroke-width="2"/>
           <rect x="85" y="60" width="30" height="25" rx="4" fill="#10B981"/>
           <line x1="75" y1="120" x2="125" y2="120" stroke="#64748B" stroke-width="3"/>
           <text x="100" y="152" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">DC 250V MCCB</text>`
  },
  {
    name: 'battery-cable',
    title: 'HEAVY DC BATTERY WIRE',
    type: 'WIRING',
    sub: '35mm²-95mm² THHN',
    accent: '#10B981',
    icon: `<path d="M45 130 C 60 70, 90 70, 110 100 C 130 130, 150 110, 155 80" stroke="#EF4444" stroke-width="12" fill="none" stroke-linecap="round"/>
           <path d="M45 150 C 60 90, 90 90, 110 120 C 130 150, 150 130, 155 100" stroke="#1E293B" stroke-width="12" fill="none" stroke-linecap="round"/>
           <circle cx="45" cy="130" r="10" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
           <circle cx="155" cy="80" r="10" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
           <text x="100" y="50" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">COPPER LUG TERMINAL</text>`
  },
  {
    name: 'dc-cable',
    title: 'SOLAR PV HOMERUN WIRE',
    type: 'WIRING',
    sub: '4mm²-6mm² XLPO UV',
    accent: '#F59E0B',
    icon: `<path d="M45 70 C 80 50, 120 120, 155 80" stroke="#EF4444" stroke-width="8" fill="none" stroke-linecap="round"/>
           <path d="M45 120 C 80 100, 120 170, 155 130" stroke="#0F172A" stroke-width="8" fill="none" stroke-linecap="round"/>
           <rect x="45" y="45" width="110" height="2" fill="#475569"/>
           <text x="100" y="35" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">1 RED (+) / 1 BLACK (-)</text>`
  },
  {
    name: 'ac-cable',
    title: 'AC UTILITY FEEDER WIRE',
    type: 'WIRING',
    sub: 'THHN/THWN COPPER',
    accent: '#38BDF8',
    icon: `<path d="M45 80 Q 100 40 155 80" stroke="#38BDF8" stroke-width="6" fill="none"/>
           <path d="M45 100 Q 100 60 155 100" stroke="#F8FAFC" stroke-width="6" fill="none"/>
           <path d="M45 120 Q 100 80 155 120" stroke="#10B981" stroke-width="6" fill="none"/>
           <text x="100" y="150" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">LINE + NEUTRAL + PE</text>`
  },
  {
    name: 'conduit',
    title: 'ELECTRICAL CONDUIT',
    type: 'CONDUIT',
    sub: 'PVC / EMT / RMC',
    accent: '#64748B',
    icon: `<rect x="40" y="70" width="120" height="60" rx="8" fill="#1E293B" stroke="#64748B" stroke-width="3"/>
           <ellipse cx="40" cy="100" rx="10" ry="30" fill="#0F172A" stroke="#64748B" stroke-width="2"/>
           <ellipse cx="160" cy="100" rx="10" ry="30" fill="#334155" stroke="#64748B" stroke-width="2"/>
           <line x1="70" y1="70" x2="70" y2="130" stroke="#475569" stroke-width="2"/>
           <line x1="130" y1="70" x2="130" y2="130" stroke="#475569" stroke-width="2"/>
           <text x="100" y="150" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">RIGID HEAVY DUTY</text>`
  },
  {
    name: 'ground-rod',
    title: 'COPPER-CLAD GROUND ROD',
    type: 'GROUNDING',
    sub: '5/8" x 8FT / 3/4" x 10FT',
    accent: '#F59E0B',
    icon: `<line x1="100" y1="30" x2="100" y2="150" stroke="#D97706" stroke-width="8" stroke-linecap="round"/>
           <polygon points="100,165 94,148 106,148" fill="#D97706"/>
           <rect x="88" y="50" width="24" height="15" rx="3" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
           <path d="M100 57 L135 75" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
           <line x1="70" y1="130" x2="130" y2="130" stroke="#64748B" stroke-width="2"/>
           <line x1="80" y1="136" x2="120" y2="136" stroke="#64748B" stroke-width="2"/>
           <line x1="90" y1="142" x2="110" y2="142" stroke="#64748B" stroke-width="2"/>
           <text x="100" y="25" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">EARTH GROUND</text>`
  },
  {
    name: 'roof-rail',
    title: '2.2M ALUMINUM ROOF RAIL',
    type: 'MOUNTING',
    sub: '6005-T5 ANODIZED',
    accent: '#94A3B8',
    icon: `<path d="M40 70 L140 50 L160 110 L60 130 Z" fill="#1E293B" stroke="#94A3B8" stroke-width="2"/>
           <path d="M60 75 L135 60 L145 95 L70 110 Z" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
           <line x1="50" y1="100" x2="150" y2="80" stroke="#F59E0B" stroke-width="2"/>
           <text x="100" y="152" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">2200mm EXTRUSION</text>`
  },
  {
    name: 'l-foot',
    title: 'ALUMINUM L-FOOT BRACKET',
    type: 'MOUNTING',
    sub: '84 x 40 x 40 MM',
    accent: '#94A3B8',
    icon: `<path d="M70 40 L90 40 L90 120 L135 120 L135 140 L70 140 Z" fill="#334155" stroke="#94A3B8" stroke-width="2"/>
           <circle cx="80" cy="65" r="5" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <circle cx="115" cy="130" r="5" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <rect x="68" y="140" width="70" height="4" fill="#0F172A"/>
           <text x="100" y="25" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">EPDM WATERPROOF PAD</text>`
  },
  {
    name: 'mid-clamp',
    title: 'SOLAR PANEL MID-CLAMP',
    type: 'MOUNTING',
    sub: '30-40MM FRAME',
    accent: '#94A3B8',
    icon: `<rect x="65" y="60" width="70" height="18" rx="2" fill="#334155" stroke="#94A3B8" stroke-width="2"/>
           <rect x="92" y="78" width="16" height="50" fill="#1E293B" stroke="#94A3B8" stroke-width="1.5"/>
           <circle cx="100" cy="69" r="4" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <line x1="45" y1="78" x2="85" y2="78" stroke="#F59E0B" stroke-width="3"/>
           <line x1="115" y1="78" x2="155" y2="78" stroke="#F59E0B" stroke-width="3"/>
           <text x="100" y="150" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">INNER JOIN CLAMP</text>`
  },
  {
    name: 'rail-splice',
    title: 'RAIL SPLICE CONNECTOR',
    type: 'MOUNTING',
    sub: '150MM INTERNAL BAR',
    accent: '#94A3B8',
    icon: `<rect x="40" y="80" width="120" height="40" rx="4" fill="#334155" stroke="#94A3B8" stroke-width="2"/>
           <circle cx="65" cy="100" r="4" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <circle cx="90" cy="100" r="4" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <circle cx="110" cy="100" r="4" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <circle cx="135" cy="100" r="4" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <text x="100" y="145" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">RAIL CONTINUITY</text>`
  },
  {
    name: 'mc4',
    title: 'MC4 CONNECTORS (M+F)',
    type: 'CONNECTOR',
    sub: '1000V-1500V IP68',
    accent: '#F59E0B',
    icon: `<rect x="45" y="85" width="50" height="30" rx="4" fill="#0F172A" stroke="#F59E0B" stroke-width="2"/>
           <rect x="95" y="90" width="20" height="20" fill="#334155"/>
           <rect x="115" y="85" width="45" height="30" rx="4" fill="#0F172A" stroke="#F59E0B" stroke-width="2"/>
           <line x1="30" y1="100" x2="45" y2="100" stroke="#EF4444" stroke-width="6"/>
           <line x1="160" y1="100" x2="175" y2="100" stroke="#EF4444" stroke-width="6"/>
           <text x="100" y="145" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">SNAP-LOCK IP68</text>`
  },
  {
    name: 'end-clamp',
    title: 'SOLAR PANEL END-CLAMP',
    type: 'MOUNTING',
    sub: '30-40MM FRAME',
    accent: '#94A3B8',
    icon: `<path d="M65 60 L120 60 L120 78 L95 78 L95 130 L65 130 Z" fill="#334155" stroke="#94A3B8" stroke-width="2"/>
           <circle cx="80" cy="95" r="5" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
           <line x1="120" y1="78" x2="155" y2="78" stroke="#F59E0B" stroke-width="3"/>
           <text x="100" y="150" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">TERMINAL CLAMP</text>`
  }
];

function generateSvg(item) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#090D16"/>
    </linearGradient>
    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(148, 163, 184, 0.08)" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="200" height="200" rx="12" fill="url(#bgGrad)"/>
  <rect width="200" height="200" rx="12" fill="url(#grid)"/>
  <rect x="2" y="2" width="196" height="196" rx="10" fill="none" stroke="rgba(148, 163, 184, 0.15)" stroke-width="1"/>
  
  <!-- Header Bar -->
  <rect x="12" y="12" width="176" height="20" rx="4" fill="rgba(30, 41, 59, 0.7)"/>
  <text x="20" y="26" fill="${item.accent}" font-size="8" font-weight="700" font-family="monospace" letter-spacing="1">${item.type}</text>
  <text x="180" y="26" text-anchor="end" fill="#94A3B8" font-size="8" font-family="monospace">${item.sub}</text>

  <!-- Technical Schematic Icon -->
  <g transform="translate(0, 0)">
    ${item.icon}
  </g>

  <!-- Title Pill -->
  <rect x="12" y="172" width="176" height="18" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(148, 163, 184, 0.2)" stroke-width="1"/>
  <text x="100" y="184" text-anchor="middle" fill="#F8FAFC" font-size="8" font-weight="600" font-family="system-ui, sans-serif" letter-spacing="0.5">${item.title}</text>
</svg>`;
}

for (const a of assets) {
  const svgContent = generateSvg(a);
  // Write both .svg and .webp (with svg content) so any URL query or extension matches cleanly
  fs.writeFileSync(path.join(outDir, `${a.name}.svg`), svgContent);
  fs.writeFileSync(path.join(outDir, `${a.name}.webp`), svgContent);
}

console.log(`Successfully generated ${assets.length} technical accessory illustrations in ${outDir}!`);
