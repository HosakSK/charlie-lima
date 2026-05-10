# Charlie-Lima — Technical Overview

> **MASTER INSTRUCTION:** If any functionality, system, or logic described in the `docs/` folder is modified, the corresponding documentation **must** be updated immediately to reflect the real-world state of the application.

> **Version:** see `package.json` → `"version"`  
> **Live URL:** [charlie-lima.eu](https://charlie-lima.eu)  
> **Repository:** GitHub → auto-deploy to Vercel  
> **For flight simulation use only. Not for real-world flight.**

---

## 1. What is Charlie-Lima?

Charlie-Lima is an interactive **aviation checklist web application** designed for flight simulation. The primary aircraft supported is the Boeing 737-800 (B738). The application provides:

- Step-by-step Normal Procedure checklists (Flow + Checklist items)
- Voice synthesis readout (Web Speech API) with NATO phonetic alphabet
- Voice command recognition for hands-free operation
- Flight Briefing notepad with departure/arrival data
- SimBrief flight plan import with automatic field mapping
- VATSIM ATIS/METAR live sync with automatic weather refresh
- Fake ATC voice simulation with country-localized greetings
- Dynamic ATC frequency resolution with multi-source database hierarchy
- Action countdown timers for timed procedures (e.g., APU start)
- Turnaround flight quick-start mode
- Multi-language Help Guide (EN, DE, IT, ES, CZ, PL, HU, FR)
- PWA support for home-screen installation

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router) | See `node_modules/next/dist/docs/` for API reference |
| UI | **React 19** | TypeScript (`tsx`) |
| State Management | **Zustand 5** | Used minimally; most state lives in `script.js` globals |
| Styling | **TailwindCSS 4** + vanilla CSS | Main styles in `public/styles.css` and `src/app/globals.css` |
| Fonts | **Inter** (UI) + **IBM Plex Mono** (mono mode) | Loaded via `next/font/google` |
| Core Checklist Logic | **Vanilla JavaScript** | `public/script.js` — loaded dynamically at runtime |
| Language | **TypeScript** (Next.js side), **ES2020+ JS** (checklist engine) |
| Hosting | **Vercel** | Auto-deploy from GitHub `main` branch |

### Runtime Architecture — Important

The Next.js app is essentially a **thin shell**. The entire checklist engine (`public/script.js`, ~3200 lines) is a standalone vanilla JS file that is dynamically injected into the page at runtime by the React component. This is intentional — it allows the checklist logic to run in the browser's global scope without bundling constraints.

```
┌─────────────────────────────────────────────────┐
│  Vercel Edge Network (CDN)                      │
├─────────────────────────────────────────────────┤
│  Next.js 15 App Router                          │
│  ├── middleware.ts ← Subdomain routing          │
│  ├── (landing)/page.tsx ← Aircraft selector     │
│  ├── (checklist)/[aircraft]/page.tsx ← Main app │
│  └── api/ ← Server-side proxies                 │
│       ├── /datasets ← Dataset discovery         │
│       ├── /simbrief ← Flight plan proxy         │
│       └── /atis ← VATSIM ATIS proxy             │
├─────────────────────────────────────────────────┤
│  Browser Runtime (Client)                       │
│  ├── {dataset}.js ← Checklist data              │
│  ├── lang.js ← Help translations                │
│  └── script.js ← ★ Core engine (vanilla JS)     │
│       ├── Rendering engine (renderPage)          │
│       ├── Voice synthesis + recognition          │
│       ├── Briefing notepad + persistence         │
│       ├── ATC variable resolver                  │
│       ├── METAR/ATIS auto-sync                   │
│       ├── SimBrief integration                   │
│       └── Action timer system                    │
└─────────────────────────────────────────────────┘
```

---

## 3. Deployment Pipeline

```
Local development (npm run dev)
        ↓
  git add . && git commit -m "3.3.XX"
        ↓
  git push → GitHub (main branch)
        ↓
  Vercel (auto-deploy on push)
        ↓
  charlie-lima.eu (production)
```

- **Vercel** detects the Next.js project and builds it automatically on every push to `main`.
- No manual build step is needed — just push and Vercel handles the rest.
- The `package.json` `"version"` field is the **single source of truth** for the app version (see `docs/versioning.md`).
- The commit message must contain **only** the version number (e.g., `git commit -m "3.3.48"`).

---

## 4. Domain & Subdomain Routing

The app runs on `charlie-lima.eu`. Subdomains are handled by **Next.js Middleware** (`src/middleware.ts`):

| URL | Resolves to |
|---|---|
| `charlie-lima.eu` | Landing page (`/`) |
| `charlie-lima.eu/b738` | B738 checklist |
| `b738.charlie-lima.eu` | B738 checklist (subdomain rewrite → `/b738`) |
| `creator.charlie-lima.eu` | Dataset Creator tool (static HTML rewrite → `/creator.html`) |
| `charlie-lima.eu/creator` | Dataset Creator (Next.js route) |

The middleware intercepts every request, detects the subdomain from the `Host` header, and rewrites the path internally. Static asset paths (`/data/`, `/icons/`, `/audio/`, `.js`, `.css`) are excluded from rewrites.

For full technical details, see [Subdomain Routing](subdomain_routing.md).

---

## 5. Project Directory Structure

```
charlie-lima/
├── .next/                   # Next.js build output (auto-generated)
├── node_modules/            # Project dependencies (auto-generated)
├── scratch/                 # Temporary AI scripts & experiments (not for production)
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, metadata, PWA)
│   │   ├── globals.css             # Global CSS variables, theming & all UI styles (~1600 lines)
│   │   ├── (landing)/page.tsx      # Landing page — lists available aircraft
│   │   ├── (checklist)/[aircraft]/ # Dynamic checklist route
│   │   │   └── page.tsx            # Loads dataset + injects script.js + renders HTML shell
│   │   ├── (creator)/creator/      # Dataset Creator route
│   │   └── api/                    # Next.js API Routes (server-side)
│   │       ├── datasets/route.ts   # Lists available checklist datasets
│   │       ├── simbrief/route.ts   # SimBrief API proxy
│   │       └── atis/route.ts       # VATSIM ATIS proxy
│   ├── data/
│   │   └── atc/                    # Server-side ATC data source (build scripts)
│   │       ├── airports_atc.json   # Master airport database (1MB, build artifact)
│   │       ├── firs_atc.json       # FIR database (build artifact)
│   │       ├── greetings_atc.json  # Greetings per country/continent
│   │       └── build_atc_data.py   # Python script for rebuilding ATC data
│   └── middleware.ts               # Subdomain routing logic
├── public/
│   ├── script.js                   # ★ Core checklist engine (vanilla JS, ~3200 lines)
│   ├── lang.js                     # Help guide translations (multi-language)
│   ├── styles.css                  # Supplementary UI stylesheet
│   ├── creator.html                # Standalone Dataset Creator tool (~68KB)
│   ├── knock.wav                   # Checkbox click sound effect
│   ├── manifest.json               # PWA manifest
│   ├── data/
│   │   ├── b738/                   # B738 checklist datasets
│   │   │   ├── europe_style.js     # European-style checklist (~50KB)
│   │   │   └── us_style.js         # US-style checklist (~40KB)
│   │   └── atc/
│   │       ├── airports_atc.json   # Client-side airport ATC frequencies (subset)
│   │       ├── airports_database/  # Regional detailed airport databases
│   │       │   ├── Europe.json     # ~500KB, indexed by ICAO
│   │       │   ├── North_America.json
│   │       │   ├── South_Latin_America.json
│   │       │   ├── Africa.json
│   │       │   ├── Middle_East.json
│   │       │   ├── Pacific_Australia.json
│   │       │   └── FIRs.json       # Flight Information Regions (global)
│   │       ├── firs_atc.json       # Legacy FIR frequencies (fallback)
│   │       └── greetings_atc.json  # Country/continent greeting phrases
│   └── icons/                      # App icons (SVG)
│       ├── favicon.svg             # Browser tab icon
│       ├── icon-maskable.svg       # PWA maskable icon
│       ├── briefing.svg            # Briefing FAB icon
│       ├── mic.svg                 # Microphone FAB icon
│       ├── reset.svg               # Reset button icon
│       ├── timer.svg               # Timer icon
│       ├── turnaround.svg          # Turnaround button icon
│       └── lines_05-2.svg          # Background decorative pattern
├── docs/
│   ├── overview.md                 # ← this file
│   ├── versioning.md               # Versioning system explained
│   ├── subdomain_routing.md        # Subdomain routing logic
│   ├── fake_atc.md                 # Fake ATC feature documentation
│   ├── briefing_atc_engine.md      # ★ Briefing & ATC Engine technical details
│   ├── settings_features.md        # User settings and functional toggles
│   ├── voice_system.md             # Voice control engine and UI documentation
│   ├── dataset_creator.md          # Visual editor tool documentation
│   └── next_steps.md               # Bug tracker & future roadmap (in Slovak)
├── package.json                    # Version, dependencies, npm scripts
├── next.config.ts                  # Next.js configuration (minimal)
├── tsconfig.json                   # TypeScript config
└── simbrief_inspect.json           # SimBrief API response reference (~800KB)
```

---

## 6. Page Routes

### 6.1 Landing Page — `(landing)/page.tsx`

- Fetches `/api/datasets` to discover available aircraft.
- Renders a button for each aircraft (e.g., B738) linking to `/{aircraft}`.
- Also links to the Dataset Creator (`/creator`).
- Displays "Loading fleet..." during async fetch, with `['b738']` fallback on error.

### 6.2 Checklist Page — `(checklist)/[aircraft]/page.tsx`

This is the main application page. It is a client component (`"use client"`) that:

1. **Renders the full HTML shell** into a `<div ref={containerRef}>` using `innerHTML` (the `getOriginalHTML()` function). This includes the top bar, settings panel, Flight Briefing overlay, voice bar, action timer, help guide, info popups, and the checklist container.

2. **Discovers datasets** by fetching `/api/datasets` and populating `window.availableDataSets`.

3. **Loads scripts sequentially** (order matters):
   - `/{aircraft_dataset}.js` — the checklist data file (sets `window.initialChecklistData`)
   - `/lang.js` — help guide translations (sets `window.HELP_TRANSLATIONS`)
   - `/script.js?v={APP_VERSION}` — the core engine (version query param busts cache)

4. After all scripts load, `script.js` calls `init()` which boots the entire checklist.

5. **Cleanup on unmount:** all dynamically injected `<script>` elements are removed.

**Why this architecture?** The checklist was originally a pure HTML/JS app. The Next.js wrapper was added later to enable routing, API routes, and Vercel deployment, while keeping the proven vanilla JS engine intact.

### 6.3 API Routes

All API routes are server-side Next.js Route Handlers in `src/app/api/`:

| Route | Method | Purpose |
|---|---|---|
| `/api/datasets` | GET | Scans `public/data/` for aircraft subdirectories and their `.js` dataset files |
| `/api/simbrief?userid=...` | GET | Proxies request to SimBrief API (`xml.fetcher.php`) and returns JSON |
| `/api/atis?icao=XXXX` | GET | Fetches live VATSIM data and extracts ATIS for the given airport |

---

## 7. Checklist Data Format

Datasets are JavaScript files (`.js`) that assign to `window.initialChecklistData`. Each dataset is an array of **page objects**:

```js
window.initialChecklistData = [
  {
    "title": "PRELIMINARY PREFLIGHT",   // Page title shown in header & nav
    "turnaround": "yes",                // Optional: show Turnaround button on this page
    "items": [
      {
        "name": "Parking brake",        // Item label (supports %variable% placeholders)
        "action": "Set",                // Response value (right side)
        "type": "flow",                 // "flow" | "checklist item" | "briefing" | "fake_atc"
        "subtype": "simplify",          // Optional: "simplify" | "test" | ["simplify","test"]
        "ifturnaround": "skip",         // Optional: auto-check on turnaround
        "landingtype": "2+3",           // Optional: only show for specific approach types
        "timer": 120,                   // Optional: start countdown timer (seconds) on check
        "timerLabel": "APU START",      // Optional: label for the timer overlay
        "timerContinuous": "yes",       // Optional: timer stays visible after end
        "timerWarning": "some item",    // Optional: warning item name for timer
        "timerAnnouncement": "Starting APU"  // Optional: TTS phrase when timer starts
      }
    ]
  }
]
```

### Item Types

| `type` | Description | Visual |
|---|---|---|
| `flow` | Cockpit flow item (pre-checklist action) | Normal challenge-response row |
| `checklist item` | Standard challenge-response checklist item | Red "Checklist" section marker |
| `briefing` | Dynamic text block populated from Flight Briefing fields | Indented grey text block |
| `fake_atc` | Simulated ATC radio communication block | Indented orange/accent text block |

### Variable Substitution in Item Names/Actions

Items can embed briefing variables using `%variable_name%` syntax. These are resolved at render time from the Flight Briefing fields. Examples:
- `"MCP V2 %v2%"` → `"MCP V2 148"` (when V2 = 148 is entered)
- `"EFIS BARO %dep_qnh%"` → `"EFIS BARO 1013"`
- When a variable is empty, it is silently removed from the displayed text.

### Conditional Tags

Briefing items support conditional blocks:
```
[IF some item name] This text appears only if the named item is checked [/IF]
```

---

## 8. The Core Engine — `public/script.js`

This is the heart of the application (~3200 lines of vanilla JavaScript). It runs entirely in the browser global scope. Key responsibilities:

### 8.1 Initialization (`init()`)
Called once after all scripts load. Sets up:
- Checklist data (`checklistData = initialChecklistData`)
- UI toggles visibility (flow/test/simplify/briefing/fake_atc options) — each toggle is **dynamically hidden** if the loaded dataset has no items of that type
- Loads briefing from `localStorage`
- Loads ATC data (parallel fetch of 4 JSON files + on-demand regional DB)
- Initializes METAR auto-sync listeners
- Calls `renderPage(true)` to draw the first page

### 8.2 Rendering (`renderPage()`)
Rebuilds the DOM checklist from scratch on every state change. Key logic:
- Filters items via `isItemVisible()` (respects all toggles: simplify, hide tests, checklist only, briefing enabled, fake ATC enabled, landing type)
- Marks the **first unchecked visible item** as `active` (bold/highlighted with accent color)
- Groups items with section subtitles (Flow / Briefing / ATC / Checklist items)
- Renders briefing items as multi-sentence text blocks with play/stop icons
- Renders `fake_atc` items with `#atc` / `#pm` role tagging — `#atc` lines are displayed in bold italic accent color, `#pm` lines in standard color
- `#pause` tags render as visual paragraph breaks
- Updates page progress bar and global progress bar
- Page navigation skips pages with no visible items

### 8.3 Settings & Persistence
All user preferences are stored in `localStorage`:

| Key | Setting | Default |
|---|---|---|
| `b738_theme` | `"dark"` / `"light"` | `light` |
| `b738_mono` | `"true"` / `"false"` — monospace font | `false` |
| `b738_muted` | `"true"` / `"false"` | `false` |
| `b738_male_voice` | `"true"` / `"false"` | `false` (Female) |
| `b738_briefing_enabled` | Show briefing items | `false` |
| `b738_fake_atc_enabled` | Show fake ATC items | `false` |
| `b738_read_cl_only` | Voice reads checklist items only (not flows) | `false` |
| `b738_disable_timer` | Disable action timers | `false` |
| `b738_simplify` | Simplify mode | `false` |
| `b738_hide_tests` | Hide test items | `false` |
| `b738_dataset` | Last selected dataset file path | First available |
| `b738_briefing_v2` | Flight Briefing field values (JSON) | `{}` |
| `b738_help_lang` | Help guide language | `en` |
| `b738_briefing_popup_seen` | Briefing info popup dismissed | `false` |
| `b738_fake_atc_popup_seen` | ATC info popup dismissed | `false` |

For full details, see [Settings & Features](settings_features.md).

### 8.4 Voice Engine (Web Speech API)
- **Speech Synthesis** — reads checklist items aloud using `window.speechSynthesis`
- **Speech Recognition** — voice commands via `window.SpeechRecognition`
- The engine supports automatic NATO phonetic spelling of abbreviations (IRS → "India Romeo Sierra"), number digit-by-digit reading, and 50+ custom phrase replacements (e.g., "G/S" → "glide slope", "WXR" → "weather")
- Voice gender is user-selectable (male/female) via preferred voice name lists with multi-platform fallbacks
- For `fake_atc` items, the ATC voice uses the **opposite gender** from the pilot voice for realism
- Manual pause can be inserted in text using `|` character (500ms) or `#pause` tag (2000ms)
- **Wake Lock:** When the microphone is active, the Screen Wake Lock API is used to prevent the device from sleeping

For full details, see [Voice System](voice_system.md).

### 8.5 Flight Briefing & ATC Engine
- A floating draggable panel with 40+ fields for departure/arrival data.
- Data is resolved from a multi-layered hierarchy (SimBrief → Live METAR → Regional JSONs → Legacy DB → FIR → Universal Fallback).
- **Smart Loading:** Regional database files are loaded on-demand based on ICAO prefix.
- **Proximity Fallback:** Frequencies are resolved using a logical chain (e.g., DEL → GND → TWR → APP → FIR).
- **Auto-Fill:** The engine populates TA, Initial Altitude, FAP ALT, ILS frequency, and course from the database when fields are empty.
- For full technical details, see [Briefing & ATC Engine](briefing_atc_engine.md).

### 8.6 Fake ATC Engine
- Loaded via `loadAtcData()` which fetches four JSON files in parallel (airports, FIRs, greetings, FIR DB)
- `updateAtcVariables()` processes origin/destination ICAO codes and resolves:
  - ATC callsigns and frequencies (DEL → GND → TWR → APP → FIR fallback chain)
  - City names for the airport
  - Localized greeting/farewell phrases (`greetings_atc.json`)
  - FIR coverage for airports not in the local dataset
- ATC variables are available as `%delivery_dep%`, `%ground_dep_freq%`, `%tower_arr%`, `%hello_dep%`, `%bye_arr%`, etc.
- Sentences prefixed with `#atc` are spoken in the opposite-gender voice and displayed in bold italic accent color
- For full details, see [Fake ATC](fake_atc.md).

### 8.7 Action Timer
- Circular SVG countdown timer overlay, draggable, launched when a timed item is checked
- Two modes:
  - **Standard:** Auto-hides after completion (with "Timer complete. We may continue." announcement)
  - **Continuous:** Stays on screen until manually closed; the checklist reading proceeds immediately
- **Warning target:** A timed item can specify `timerWarning: "item name"` — the voice engine will refuse to read that item until the timer finishes, saying "Wait for timer."
- **Timer announcement:** Optional TTS phrase spoken when the timer starts
- Timer is constrained to viewport bounds on resize

### 8.8 METAR Auto-Sync
- When the user enters/changes an ICAO code in the Origin or Destination field, the engine automatically fetches live METAR data from `metar.vatsim.net`
- Parsed fields: Wind (direction/speed), Temperature, Dewpoint, QNH
- Additionally fetches VATSIM ATIS letter via the `/api/atis` proxy
- A manual "Sync METAR" button forces a refresh of all weather fields (overwriting existing values)
- The SimBrief import automatically triggers METAR sync after completion

### 8.9 SimBrief Integration
- User enters their SimBrief User ID and clicks the sync button
- The app fetches the latest flight plan via `/api/simbrief?userid=...`
- Fields auto-populated: callsign, origin/destination, fuel data, speeds (V1/VR/V2/VREF), trim, squawk, weather, runway, SID/STAR, initial/cruise altitude, gate, taxi routes, flaps, assumed temperature, and autobrake
- **METAR Temperature Parsing:** Falls back to regex extraction (`(M?\d{2})\/(M?\d{2})`) from raw METAR strings
- **Autobrake Mapping:** Translates SimBrief strings like "MAX MAN" → "3", "MED" → "3", "LOW" → "1", "MAX" → "MAX"
- **Dynamic Runway Updates:** When the runway field changes, performance data (V-speeds, ILS, course) is re-resolved from the cached SimBrief data

### 8.10 Squawk Generator
- A utility button in the Flight Briefing notepad generates a random 4-digit octal squawk code
- Each digit is 0-7 (valid transponder range)
- Explicitly excludes reserved codes: `7000`, `7500`, `7600`, `7700`, `1200`, `2000`, `0000`

### 8.11 Global Progress Bar
- A 3px accent-colored bar fixed at the very top of the viewport
- Tracks **overall progress** across all checklist pages (not just the current page)
- Uses gradient + glow shadow for visual polish
- Smoothly transitions using `cubic-bezier(0.4, 0, 0.2, 1)`

---

## 9. Dataset Creator (`public/creator.html`)

A standalone single-file HTML/JS/CSS application (~68KB) for creating and editing checklist datasets. Accessible at:
- `creator.charlie-lima.eu` (via subdomain middleware rewrite to `/creator.html`)
- `charlie-lima.eu/creator` (via Next.js creator route)

The creator exports `.js` files compatible with the dataset format described in Section 7.

For full details, see [Dataset Creator](dataset_creator.md).

---

## 10. Multi-language Support

The file `public/lang.js` sets `window.HELP_TRANSLATIONS` — an object keyed by language code (`en`, `de`, `it`, `es`, `cz`, `pl`, `hu`, `fr`). The Help Guide panel switches content based on the user's selection, which is persisted in `localStorage` (`b738_help_lang`).

The Help Guide contains sections for:
- Voice commands
- Checklist modes
- Turnaround flight
- Action timers
- Theme & display settings
- Flight Briefing usage

---

## 11. PWA Support

The app is configured as a **Progressive Web App**:
- `public/manifest.json` — defines app name, icons, display mode
- `src/app/layout.tsx` — sets `appleWebApp: { capable: true, statusBarStyle: "black-translucent" }` for iOS home-screen support
- `viewport` is locked (no user scaling, `maximumScale: 1`) for a native-app feel on mobile
- Theme color: `#1a1a2e` (set in `layout.tsx`, dynamically updated by `applyTheme()` to match light/dark mode)

---

## 12. Responsive Design

The application supports three distinct layout modes:

| Viewport | Behavior |
|---|---|
| **Desktop (>1450px)** | FABs positioned right-side, full top bar with all labels, wide settings panel |
| **Tablet (701–1450px)** | FABs centered at bottom, accordion briefing, voice bar visible |
| **Mobile (351–700px)** | Compact layout, no voice bar (mic button pulses instead), accordion notepad sections |
| **Ultra-small (≤350px)** | "Cockpit mode" — only voice bar fills the entire screen; top bar, FABs, and footer are hidden |

---

## 13. Key Conventions for Developers

1. **Never edit `script.js` through Next.js bundling** — it lives in `public/` and is loaded as a plain `<script>` tag at runtime.
2. **Version is set only in `package.json`** — it propagates automatically to cache-busting and the footer display. See `docs/versioning.md`.
3. **Adding a new aircraft** — create a new subdirectory in `public/data/{aircraft}/` with at least one `.js` dataset file. The `/api/datasets` route discovers it automatically. The subdomain `{aircraft}.charlie-lima.eu` also works automatically.
4. **Adding new briefing variables** — add the field `id` to the `BRIEF_FIELDS` array in `script.js` and add the corresponding `<input>` element in `page.tsx`'s `getOriginalHTML()` function.
5. **Adding new ATC variables** — add the variable name to the `atcVarNames` array in `getFakeAtcValidSentences()` in `script.js`, and populate it in `updateAtcVariables()`.
6. **Styles** — primary styles are in `src/app/globals.css` (~1600 lines). Supplementary styles are in `public/styles.css`. Both files share CSS variables defined in `:root` and `[data-theme="dark"]`.
7. **localStorage keys** — all keys use the `b738_` prefix for namespace isolation.
8. **Global state** — all runtime state lives as global variables in `script.js` (e.g., `checklistData`, `currentPageIndex`, `atcVariables`, `isMuted`, `isListening`).

---

## 14. Master Instructions

These are high-priority rules that MUST be followed for every code modification:

1. **Version Bump before Push**: Always increment the application version by `0.0.1` (PATCH) in `package.json` before performing a `git push`, following the rules in `docs/versioning.md`.
2. **Commit Naming**: The name (message) of the git commit must contain ONLY the version number (e.g., `git commit -m "3.3.48"`). No other description is allowed in the commit title.
3. **Documentation Sync**: If any functionality described in `docs/` is modified, the corresponding documentation must be updated immediately.

---

## 15. Documentation Index

| Document | Scope |
|---|---|
| [overview.md](overview.md) | Master overview (this file) |
| [versioning.md](versioning.md) | Version management system |
| [subdomain_routing.md](subdomain_routing.md) | Subdomain rewrite logic |
| [briefing_atc_engine.md](briefing_atc_engine.md) | Flight Briefing notepad & ATC variable resolver |
| [fake_atc.md](fake_atc.md) | Fake ATC voice simulation feature |
| [voice_system.md](voice_system.md) | Voice recognition & synthesis engine |
| [settings_features.md](settings_features.md) | User settings, toggles & UI interactions |
| [dataset_creator.md](dataset_creator.md) | Visual dataset editor tool |
| [next_steps.md](next_steps.md) | Bug tracker & roadmap |

---

*Last updated: 2026-05-10*
