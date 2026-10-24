# Kito Solar — Solar PV Hybrid & On-Grid Engineering Studio

An interactive, high-precision engineering configurator and CAD studio for Solar Photovoltaic (PV) systems, designed for Philippine solar contractors, electrical engineers, and system designers. Fully aligned with the Philippine Electrical Code (PEC) Article 6.90 and Energy Regulatory Commission (ERC) Net Metering rules.

🌐 **Live Application**: [https://kito-solar.vercel.app](https://kito-solar.vercel.app)

---

## ⚡ Integrated Engineering Studios

Kito Solar unifies five synchronized engineering workspaces through a centralized Workspace Command Dock. Calculations flow continuously across load sizing, satellite roof geometry, electrical protection schedules, real-time power telemetry, and 25-year financial modeling.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WORKSPACE COMMAND DOCK                             │
└──────┬───────────────┬───────────────┬───────────────┬───────────────┬──────┘
       │               │               │               │               │
       ▼               ▼               ▼               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  Studio 01   ││  Studio 02   ││  Studio 03   ││  Studio 04   ││  Studio 05   │
│  Appliance   ││  Satellite   ││  3D Wall CAD ││  25-Year ROI ││  Solar Yield │
│  Load & Inrush││  Roof & Sun  ││  & PEC Sched ││  & Tariffs   ││  Digital Twin│
└──────────────┘└──────────────┘└──────────────┘└──────────────┘└──────────────┘
```

### 1. Studio 01 • Appliance Load & Motor Surge Sizing Engine
- **Philippine Appliance Profiles**: 18+ local presets including split-type inverter air conditioners, deep well jet pumps, induction cooktops, and WFH computer workstations.
- **Inrush Surge Analysis**: Calculates startup motor surges (1.0x to 3.5x multiplier) to prevent inverter overload faults.
- **Day vs. Night Consumption Split**: Isolates daytime consumption (8:00 AM – 4:00 PM solar production window) from evening usage to properly size LiFePO4 battery banks without over- or under-investing.
- **Starter Archetypes**: Quick-load baseline templates for WFH setups, family homes, and agricultural/commercial facilities.
- **Zero Friction**: Operates completely in-browser without requiring an account.

### 2. Studio 02 • Geodesic Satellite Roof Mapper & 3D Sun Simulator
- **High-Resolution Satellite Basemaps**: Integrated Leaflet satellite layer with priority Philippine geocoding across Barangays, Municipalities, and Provinces (defaulting to Samson St, Malabon).
- **Multi-Face Polygon Tracing**: Draw and edit arbitrary roof faces with real-time area calculation ($m^2$) and a precision satellite compass widget.
- **3D Interactive Roof Viewport**: Three.js viewport featuring 3D XYZ rotation rings, pitch arc gimbals, side-aligned incline tools ($0^\circ$ to $60^\circ$), and planar translation gizmos.
- **NASA POWER Solar Climatology**: Scrub the physical 3D sun position from 6:00 AM to 6:00 PM with animated sunlight ray vectors matching local latitude and longitude.
- **Custom PV Module Packing**: Define custom module dimensions (length, width, wattage) or choose standard 550W–600W Tier-1 formats with automated collision-free panel packing across distinct roof facets.

### 3. Studio 03 • Wall-Mounted 3D CAD & PEC Electrical Workbench
- **Three.js Wall-Mounted CAD**: Interactive 3D backboard rendering with orthogonal EMT metallic conduits, cast aluminum corner fittings, mounting straps, and animated current flow beads.
- **Synchronized 2D Single-Line Diagram (SLD)**: Vector schematic diagram with bi-directional component selection and inspector cross-highlighting.
- **Deterministic Electrical Engine**:
  - **Code Standards**: Adheres to PEC Article 6.90 and NEC 690 continuous duty requirements (125% safety factor).
  - **DC Side**: Module string Voc, Isc, temperature derating, DC rotary isolator sizing, DC molded-case circuit breakers, and Type 2 SPDs.
  - **AC Side**: Inverter continuous output current, AC breaker trip ratings, THHN/THWN-2 copper conductor gauges, and conduit fill diameters.
  - **Battery Subsystem**: Continuous discharge current, C-rate compliance, and heavy-gauge battery disconnect cabling.
  - **Grounding & Bonding**: Equipment Grounding Conductors (EGC) and Grounding Electrode Conductors (GEC) sized to PEC Table 3.10.1.16 / UL 467.
- **Dynamic Topology Switching**: Toggle between **HYBRID** (with battery energy storage and Automatic Transfer Switch) and **ON-GRID** (direct string inverter feed to main panel).
- **Mounting Bill of Materials (BOM)**: Structural aluminum rail lengths, splice kits, L-feet brackets with EPDM gaskets, mid-clamps, end-clamps, bonding jumpers, and MC4 connectors.

### 4. Studio 04 • 25-Year Financial ROI, Tariff Inflation & ERC Net Metering
- **Philippine Utility Presets**: Pre-configured rate schedules for Meralco, BATELEC, VECO, DLPC, CEPALCO, and electric cooperatives.
- **Compounding Tariff Inflation**: Models long-term utility bill escalation based on historical Philippine rate inflation (default 4.5%/yr).
- **Export Mode Comparison**:
  - **Zero-Export**: Models midday energy clipping when solar production exceeds daytime load.
  - **ERC Net Metering**: Computes export generation credits (DU blended generation cost) against retail import tariffs.
  - **Hybrid Energy Storage**: Evaluates evening battery cycling to minimize grid import charges.
- **25-Year Milestone Ledger**: Complete amortization table tracking annual savings, Levelized Cost of Electricity (LCOE), Net Present Value (NPV), and exact breakeven month.
- **Equipment Lifecycle Factoring**: Accounts for Year 11/12 string inverter renewals and LiFePO4 battery degradation over 6,000 cycles.
- **PDF Financial Proposal Export**: Generates client-facing financial proposals with milestone charts and return metrics.

### 5. Studio 05 • Real-Time Solar Yield & Digital Twin Simulator
- **24-Hour Diurnal Yield Simulation**: Models hourly solar production curves factoring ambient temperature derating, cloud cover, clipping thresholds, and inverter conversion efficiency.
- **Digital Twin Telemetry**: Real-time interactive power flow diagram tracking energy movement between solar PV arrays, hybrid inverters, LiFePO4 battery banks, facility loads, and the utility grid.
- **Brownout Stress Test Mode**: Simulates sudden utility blackout events to verify battery discharge headroom and automatic critical load support via Automatic Transfer Switches (ATS).
- **Daily Energy Balance Ribbon**: Continuous tracking of daily generation ($kWh$), self-consumption ratio, grid export credits, and avoided utility charges.

### 6. AI Solar Copilot ("Jenny") / Quick-Start Sizing Studio
- **Bill-to-System Sizing**: Enter monthly electricity spend (quick presets for ₱7,000, ₱12,000, ₱20,000, ₱35,000 or custom amounts) to automatically recommend inverter capacity and panel counts.
- **Hardware Matching**: Matches in-stock Tier-1 hybrid inverters (Deye, Growatt, Solis) and high-voltage/low-voltage LiFePO4 storage units.
- **PEC Compliance Checking**: Validates MPPT voltage windows and minimum conductor ampacities directly inside the sizing conversation.

---

## 🛠️ Architecture & Tech Stack

```
kito-solar/
├── src/
│   ├── components/
│   │   ├── home/                     # Workspace Command Dock, Bento showcase, landing layout
│   │   ├── header/                   # Sticky studio navigation and theme switching
│   │   ├── ai/                       # BillQuickStartBanner & Jenny AI copilot integration
│   │   └── cad/                      # Three.js 3D wall-mount CAD & 2D Single-Line Diagram
│   │
│   ├── features/
│   │   ├── load-calculator/          # Studio 01: Appliance load, motor surge, day/night profiles
│   │   ├── solar-mapper/             # Studio 02: Leaflet satellite basemap, 3D roof canvas, sun engine
│   │   ├── financial-roi/            # Studio 04: 25-yr cashflow, tariff inflation, ERC Net Metering
│   │   └── yield-simulator/          # Studio 05: 24h diurnal yield curve, digital twin power flow
│   │
│   ├── utils/                        # Pure deterministic engineering engines
│   │   ├── calculateDc.ts            # String Voc/Isc, 125% continuous factor, DC breakers/isolators
│   │   ├── calculateAc.ts            # Inverter AC output, wire gauge (THHN), conduit fill
│   │   ├── calculateBattery.ts       # C-rate limits, battery breaker, discharge cabling
│   │   ├── calculatePvSizing.ts      # Temperature derating, MPPT voltage windows
│   │   ├── calculateStringSizing.ts  # Series modules, parallel strings per MPPT tracker
│   │   ├── calculateMounting.ts      # Rails, L-feet brackets, clamps, bonding jumpers
│   │   ├── calculateGrounding.ts     # Equipment grounding conductors (EGC) & grounding electrodes
│   │   ├── calculateAts.ts           # Automatic transfer switch sizing
│   │   └── calculateSystem.ts        # Overall system audit and PEC 6.90 code violation checks
│   │
│   └── store/                        # Global state management via Zustand
│       ├── useCalculatorStore.ts     # Central electrical configuration and CAD state
│       └── ...                       # Feature-specific isolated stores
```

### Core Technologies
- **Frontend Core**: React 19, Vite 6, TypeScript 5.7
- **Styling & Design System**: Tailwind CSS, Lucide Icons, clean single-surface card architecture
- **3D Graphics & Physics**: Three.js, React Three Fiber, `@react-three/drei`
- **Geospatial & Mapping**: Leaflet, NASA POWER API, OpenStreetMap Nominatim
- **Data & Auth**: Supabase PostgreSQL with Row-Level Security (RLS) partitioned by `auth.uid()`, with offline fallback
- **Export & Documents**: `@react-pdf/renderer` and jsPDF for specification schedules and proposals

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

### 4. Code Quality & Type Check
```bash
npm run lint
```

### 5. Running Automated Tests
```bash
npm run test
```

### 6. Production Build
```bash
npm run build
```

---

## 🗄️ Supabase Configuration (Optional)

The application functions completely out of the box using bundled offline hardware data without requiring an external database. To connect a live Supabase instance:

1. Create a project on [Supabase](https://supabase.com).
2. Run database migrations to initialize tables and enable Row-Level Security (RLS) on `user_projects`.
3. Add your environment variables in a `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the development server (`npm run dev`). The application automatically switches to live Supabase queries.

---

## 📜 Engineering Disclaimer

Calculations are based on configured equipment specifications, the Philippine Electrical Code (PEC) Article 6.90, and standard electrical engineering rules. Final equipment selection, conductor sizing, protection ratings, grounding, physical layout, and code compliance must be reviewed and certified by a licensed professional electrical engineer prior to procurement or installation.
