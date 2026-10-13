# Kito Solar — Solar PV Hybrid & On-Grid Engineering Studio

An interactive, high-precision engineering configurator for Solar Photovoltaic (PV) systems, designed for solar engineers, electrical contractors, and system designers.

🌐 **Live Application**: [https://kito-solar.vercel.app](https://kito-solar.vercel.app)

---

## ⚡ Core Capabilities

- **Deterministic Calculation Engine**: Independent of UI state, verified with automated unit and regression tests. Calculates continuous duty currents (125% code factor), breaker trip ratings, DC/AC isolators, Type 2 SPDs, wire gauges, and conduit fill diameters.
- **Wall-Mounted 3D CAD Studio**: Built with Three.js and React Three Fiber. Switchgear is mounted vertically against an architectural backboard with orthogonal EMT metallic conduit runs, cast aluminum corner fittings, wall mounting straps, and animated electric current beads.
- **Synchronized 2D Single-Line Schematic (SLD)**: Interactive vector schematic diagram with bi-directional selection and hover highlighting tied to the 3D studio and component inspector.
- **Dynamic Topology Switching**: Configures either **HYBRID** (with battery energy storage systems and backup paths) or **ON-GRID** (direct string inverter feed to AC distribution).
- **Physical Electrical Sequencing**:
  - **DC Side**: Solar PV String Array → DC Rotary Isolator → DC Breaker & SPD → Inverter MPPT.
  - **AC Side**: Inverter Output → AC Breaker & SPD → AC Isolator → Main Service Panel → Facility Load.
  - **Transfer Switch**: Automatic Transfer Switch (ATS) close-coupled to the Main Service Panel.
- **Mounting Bill of Materials (BOM)**: Calculates structural rail lengths, rail splice kits, L-feet brackets with EPDM gaskets, mid-clamps, end-clamps, bonding jumpers, and MC4 connectors.
- **Project Cloud Workspace**:
  - Save, reload, and edit up to 20 design configurations per authenticated account.
  - Shareable 20-character short URL routing (`/projects/<short-id>`).
  - Automatic cloud persistence via Supabase PostgreSQL with local cache fallback for offline continuity.
  - Input sanitization against script injection, HTML markup, and non-printable control characters.
- **Engineering PDF Export**: Generates printable specification schedules and Bills of Materials in PDF format.

---

## 🛠️ Architecture & Tech Stack

```
React 19 + Vite 6 + TypeScript 5.7
│
├── UI Layer (Tailwind CSS + Lucide)
│   ├── Segmented Workbench (Electrical Schedules, PV Sizing, Mounting BOM, Warnings)
│   ├── Interactive 3D CAD Viewport & 2D Single-Line Diagram
│   ├── Component Inspector Specs Sheet
│   └── Account & Saved Projects Management
│
├── Interactive 3D CAD Diagram (Three.js + React Three Fiber + Drei)
│   ├── Orthogonal EMT Metallic Conduit Routing
│   ├── Animated Current Particle Flow
│   ├── Grounding Copper Busbar (UL 467 / NEC 250)
│   └── OrbitControls (Rotate, Pan, Zoom, Reset)
│
├── Pure Calculation Engine
│   ├── calculateDc.ts (String Voc, Isc, continuous current, breaker, wire, conduit)
│   ├── calculateAc.ts (Inverter AC output, breaker, wire, conduit, main panel)
│   ├── calculateBattery.ts (C-rate, continuous discharge, battery breaker, cabling)
│   ├── calculatePvSizing.ts (MPPT voltage window, temperature coefficients)
│   ├── calculateStringSizing.ts (Series modules, parallel strings per MPPT)
│   ├── calculateMounting.ts (Rails, L-feet, splices, clamps, bonding)
│   ├── calculateGrounding.ts (Equipment grounding conductor, earth electrode)
│   ├── calculateAts.ts (ATS rating, transfer sizing)
│   └── calculateSystem.ts (System health audit & code violation warnings)
│
└── Data Layer (Supabase PostgreSQL + Offline Seed Fallback)
    ├── solar_inverters (270 models)
    ├── solar_modules (188 models)
    ├── batteries (20 models)
    ├── calculator_rule_breakers (44 rules)
    ├── calculator_rule_wires (63 rules)
    ├── calculator_rule_conduit (57 rules)
    ├── calculator_rule_isolators (44 rules)
    ├── calculator_rule_grounding (22 rules)
    └── user_projects (Row-Level Security partitioned by auth.uid())
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on v24.13.0)
- **npm** v10+

### 2. Installation
```bash
git clone https://github.com/apaulvincent/kito-solar.git
cd kito-solar
npm install
```

### 3. Local Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running Automated Tests
```bash
npm run test
```

### 5. Production Build
```bash
npm run build
```

---

## 🗄️ Supabase Configuration (Optional)

The application functions out of the box using bundled offline data without requiring an external database. To connect a live Supabase instance:

1. Create a project on [Supabase](https://supabase.com).
2. Run database migrations to initialize tables and enable Row-Level Security (RLS) on `user_projects`.
3. Add your environment variables in a `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the development server (`npm run dev`). The app switches to live Supabase queries automatically.

---

## 📜 Engineering Disclaimer

Calculations are based on configured component specifications and standard electrical engineering rules. Final equipment selection, conductor sizing, protection ratings, grounding, physical layout, and code compliance must be reviewed and certified by a licensed professional electrical engineer prior to procurement or installation.
