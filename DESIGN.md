# Design System: Kito Solar PV Architectural Studio

## 1. Visual Theme & Atmosphere
A clean, light-mode architectural engineering studio inspired by Swiss modernist industrial design and precision CAD tools. The atmosphere is clinical yet warm — reminiscent of a well-lit high-end renewable engineering lab. Pure white work surfaces (`#FFFFFF`), whisper-soft slate structural borders (`#E2E8F0`), deep charcoal typography (`#0F172A`), and an energetic Solar Amber accent (`#D97706`).

- **Density:** 7 (Daily App Balanced / Engineering Precision) — Generous breathing room, clear spatial hierarchy, comfortable data readability without cramped clutter.
- **Variance:** 6 (Offset Asymmetric) — 2-column asymmetric layout with interactive schematic focal viewport, live KPI ticker, and categorized electrical cards.
- **Motion:** 6 (Fluid & Weighted) — Smooth spring physics (`stiffness: 120, damping: 22`) on selection; directional electron pulses along busbars; subtle hover lifts (`-1px` to `-2px`).

## 2. Color Palette & Roles
- **Canvas Ground** (`#F8FAFC`) — Soft off-white studio surface (Slate-50).
- **Surface Pure** (`#FFFFFF`) — Primary card and container fill with crisp definition.
- **Surface Subtle** (`#F1F5F9`) — Input fields, table headers, elevated cards (Slate-100).
- **Surface Active** (`#E2E8F0`) — Hover highlights, active tab fills, badge backgrounds (Slate-200).
- **Whisper Border** (`#E2E8F0` / `rgba(226, 232, 240, 0.9)`) — 1px structural dividing lines and module outlines.
- **Charcoal Ink** (`#0F172A`) — Primary display and body text (Slate-900). Never pure black `#000000`.
- **Muted Steel** (`#64748B`) — Technical metadata, units, secondary labels (Slate-500).
- **Solar Amber Accent** (`#D97706`) — Single primary accent for CTAs, active circuits, and focal indicators.
- **Energy Emerald** (`#059669`) — Valid parameters, normal operating range, battery charged state.
- **Caution Gold** (`#D97706`) — Sizing advisories, marginal string voltage.
- **Fault Crimson** (`#DC2626`) — Safety hazards, overvoltage risks, incompatible equipment.

## 3. Typography Rules
- **Display & Headlines:** `Plus Jakarta Sans` / `Outfit` — Track-tight, controlled scale, weight-driven hierarchy.
- **Body:** `Plus Jakarta Sans` — Relaxed leading, 65ch max-width, neutral secondary color.
- **Mono:** `JetBrains Mono` / `Geist Mono` — Mandatory for all electrical metrics (`V`, `A`, `W`, `kW`, `mm²`, `AWG`, breaker ratings, string multipliers, and quantities).
- **Banned:** `Inter`, system default sans, generic serif fonts (`Times`, `Georgia`).

## 4. Component Stylings
- **Cards:** Crisp white backgrounds, rounded corners (`16px`), 1px whisper border (`#E2E8F0`), subtle diffused shadow (`0 1px 3px rgba(0,0,0,0.04)`).
- **Buttons:** Tactile feedback on press. Primary in Solar Amber (`#D97706`) with crisp white text; secondary in white with 1px border.
- **Interactive Diagram:**
  - Light architectural studio backdrop (`#F8FAFC` to `#FFFFFF`) with crisp light grid lines (`#E2E8F0`).
  - Realistic, clean hardware models (White/Platinum inverter chassis, tempered glass PV panels with aluminum borders, lithium powerwall enclosure, DIN-rail breakers with colored toggles).
  - Proper 3D horizontal cable routing using quaternion orientation vectors (fixing vertical stick bugs).
  - High-resolution HTML billboarding tags (`<Html center>`) for pin-sharp, perfectly legible typography at any camera angle.
  - Dual Schematic View: Instant toggle between **3D CAD Studio** and **2D Single-Line Schematic**.

## 5. Anti-Patterns (Banned)
- No muddy black silhouettes or dark void backdrops.
- No vertical rod/stick cable glitches.
- No blurry skewed 3D canvas text.
- No purple neon glows, AI sparkles, or futuristic cyan fluff.
- No `Inter` font.
- No pure black (`#000000`).
- No generic AI marketing clichés.
