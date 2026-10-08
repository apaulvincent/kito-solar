# Kito Solar — Solar PV Hybrid & On-Grid Engineering Calculator

An interactive, high-precision engineering configurator for Solar Photovoltaic (PV) systems, designed for solar engineers, electrical contractors, and system designers. Rebuilt from the official `V10.4_Solar PV Excel Calculator.xlsx` (HYBRID & ONGRID worksheet) into a modern web application following:

> **Configure → Calculate → Understand → Visualize → Review**

---

## ⚡ Core Capabilities

- **Pure Deterministic Calculation Engine**: Independent of React, fully unit-tested with Vitest against official regression reference fixtures.
- **First-Class Interactive 3D Diagram**: Built with Three.js & React Three Fiber. Selecting or hovering over any calculated electrical result (e.g. DC Breaker, AC Isolator, Battery MCCB) highlights the exact 3D component and connected conductors in real-time, accompanied by an engineering spec sheet.
- **Dynamic Topology Modes**: Automatically classifies system as **HYBRID** (with battery storage and EPS backup paths) or **ON-GRID** (direct string inverter feed to AC distribution).
- **Comprehensive Protection Sizing**: Calculates continuous duty current (125% factor), DC/AC circuit breakers, isolators, Type 2 SPDs, cable gauges, and conduit sizing.
- **Mounting Bill of Materials (BOM)**: Automatically calculates quantities, specs, and explanations for 2.2 m roof rails, L-feet, mid-clamps, end-clamps, rail splices, and MC4 connectors.
- **Offline-Ready with Supabase Integration**: Bundles offline seed datasets for immediate out-of-the-box operation and provides full Supabase repository querying with Row Level Security (RLS) support.

---

## 🛠️ Tech Stack & Architecture

```
React 19 + Vite 6 + TypeScript 5.7
│
├── UI Layer (Tailwind CSS + Lucide + Framer Motion)
│   ├── Configuration Workbench (Inverter, PV Module, Battery, Grid)
│   ├── Telemetry HUD Summary
│   ├── PV Sizing Matrix (Min, Recommended, Max, String architecture)
│   ├── DC Electrical Protection & Conductor Results
│   ├── AC Electrical Distribution Results
│   ├── Battery Storage Results (Hybrid Mode)
│   ├── Mounting Hardware BOM (6 Accessories)
│   ├── Safety & Health Warnings Panel
│   └── Component Inspector Modal
│
├── Interactive 3D CAD Diagram (Three.js + React Three Fiber + Drei)
│   ├── Hybrid vs On-Grid Topology Switching
│   ├── Animated Power Flow Current Particles
│   ├── Bi-directional Hover & Focus Highlighting
│   └── OrbitControls (Rotate, Pan, Zoom, Reset)
│
├── Pure Calculator Engine
│   ├── calculateDc.ts
│   ├── calculateAc.ts
│   ├── calculateBattery.ts
│   ├── calculatePvSizing.ts
│   ├── calculateStringSizing.ts
│   ├── calculateMounting.ts
│   ├── calculateGrounding.ts
│   ├── calculateAts.ts
│   └── calculateSystem.ts (Health audit & warnings)
│
└── Data Layer (Supabase + Offline Seed)
    ├── solar_inverters (270 models)
    ├── solar_modules (188 models)
    ├── batteries (20 models)
    ├── calculator_rule_breakers (44 rules)
    ├── calculator_rule_wires (63 rules)
    ├── calculator_rule_conduit (57 rules)
    ├── calculator_rule_isolators (44 rules)
    ├── calculator_rule_grounding (22 rules)
    └── calculator_accessories (20 items)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on v24.13.0)
- **npm** v10+

### 2. Installation
```bash
git clone <repo-url>
cd kito-solar
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running Regression & Unit Tests
```bash
npm run test
```

### 5. Production Build
```bash
npm run build
```

---

## 🗄️ Supabase Setup & Seeding

The application runs immediately using bundled offline data without requiring a Supabase instance. When connecting your Supabase project:

1. Create a new Supabase project at [database.new](https://database.new).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the seed script:
   ```bash
   supabase_hybrid_ongrid_seed.sql
   ```
4. Copy your project URL and public Anon key, then create a `.env` file in the root folder:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart your Vite development server (`npm run dev`). The application automatically switches from local seed mode to live Supabase queries.

---

## 🔬 Regression Fixture Verification (PRD Section 21)

The calculation engine is strictly validated against the official Excel reference case:

| Parameter | Input | Expected Output | Engine Status |
| :--- | :--- | :--- | :--- |
| **Inverter** | `SRNE HESP4860S100-H` | 6.0 kW AC / 9.0 kW PV Max | ✅ Verified |
| **PV Module** | `Canadian Solar CS6R-585MS` | 585 Wp / 14.1 A Isc | ✅ Verified |
| **Battery** | `24V-150 Ah` | 150 A Discharge | ✅ Verified |
| **Grid Voltage** | `230 V` | Utility Single-Phase | ✅ Verified |
| **Main Breaker**| `100 A` | Residential Service | ✅ Verified |
| **DC Continuous Current** | `14.1 A × 125%` | **17.625 A** | ✅ Verified |
| **DC Breaker** | Mapped | **20 A** | ✅ Verified |
| **DC Homerun Cable** | Mapped | **4.0mm² THHN/THWN (12 AWG)** | ✅ Verified |
| **DC SPD** | Inverter Vmax | **600V DC SPD** | ✅ Verified |
| **AC Continuous Current** | `28.6 A × 125%` | **35.75 A** | ✅ Verified |
| **AC Grid Breaker** | Mapped | **40 A** | ✅ Verified |
| **AC Feeder Cable** | Mapped | **14.0mm² THHN/THWN (8 AWG)** | ✅ Verified |
| **AC SPD** | Grid Matched | **440V AC SPD** | ✅ Verified |
| **Recommended Panels** | `6000 W / 585 W` | **10 Modules** | ✅ Verified |
| **Maximum Panels** | `9000 W / 585 W` | **15 Modules** | ✅ Verified |
| **Recommended Strings**| Dual MPPT | **2 Strings** (5 panels each) | ✅ Verified |
| **Battery MCCB** | Battery Spec | **188 A** | ✅ Verified |
| **Battery Wire** | Mapped | **70 mm² THHN/THWN (2/0 AWG)** | ✅ Verified |
| **ATS Switch** | Mapped | **100 A ATS** | ✅ Verified |

---

## 📜 Engineering Disclaimer
Calculations are based on the configured component specifications and this calculator's rule set. Final equipment selection, conductor sizing, protection, grounding, installation, and code compliance must be verified by a qualified electrical professional and applicable local requirements.
