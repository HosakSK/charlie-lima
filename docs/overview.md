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
- Voice synthesis readout (Web Speech API)
- Voice command recognition (for hands-free operation)
- Flight Briefing notepad (departure/arrival data)
- SimBrief flight plan import
- Fake ATC voice simulation
- VATSIM ATIS/METAR live sync
- Action countdown timers for timed procedures

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

### Runtime Architecture — Important

The Next.js app is essentially a **thin shell**. The entire checklist engine (`public/script.js`) is a standalone vanilla JS file that is dynamically injected into the page at runtime by the React component. This is intentional — it allows the checklist logic to run in the browser's global scope without bundling constraints.

---

## 3. Deployment Pipeline

```
Local development (npm run dev)
        ↓
  git add . && git commit
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

---

## 4. Domain & Subdomain Routing

The app runs on `charlie-lima.eu`. Subdomains are handled by **Next.js Middleware** (`src/middleware.ts`):

| URL | Resolves to |
|---|---|
| `charlie-lima.eu` | Landing page (`/`) |
| `charlie-lima.eu/b738` | B738 checklist |
| `b738.charlie-lima.eu` | B738 checklist (subdomain rewrite → `/b738`) |
| `creator.charlie-lima.eu` | Dataset Creator tool (static HTML) |

The middleware intercepts every request, detects the subdomain from the `Host` header, and rewrites the path internally. Static asset paths (`/data/`, `/icons/`, `.js`, `.css`) are excluded from rewrites.

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
│   │   ├── globals.css             # Global CSS variables & base styles
│   │   ├── (landing)/page.tsx      # Landing page — lists available aircraft
│   │   ├── (checklist)/[aircraft]/ # Dynamic checklist route
│   │   │   └── page.tsx            # Loads dataset + injects script.js
│   │   ├── (creator)/creator/      # Dataset Creator route
│   │   └── api/                    # Next.js API Routes (server-side)
│   │       ├── datasets/route.ts   # Lists available checklist datasets
│   │       ├── airports/route.ts   # Airport ATC frequency lookup
│   │       ├── simbrief/route.ts   # SimBrief API proxy
│   │       └── atis/route.ts       # VATSIM ATIS proxy
│   ├── data/
│   │   └── atc/                    # Server-side ATC data (airports_atc.json)
│   └── middleware.ts               # Subdomain routing logic
├── public/
│   ├── script.js                   # ★ Core checklist engine (vanilla JS, ~3100 lines)
│   ├── lang.js                     # Help guide translations (multi-language)
│   ├── styles.css                  # Main UI stylesheet
│   ├── creator.html                # Standalone Dataset Creator tool
│   ├── knock.wav                   # Checkbox click sound effect
│   ├── manifest.json               # PWA manifest
│   ├── data/
│   │   ├── b738/                   # B738 checklist datasets
│   │   │   ├── europe.json         # Raw data (reference/source)
│   │   │   ├── europe_style.js     # European-style checklist (loads via script tag)
│   │   │   └── us_style.js         # US-style checklist
│   │   └── atc/
│   │       ├── airports_atc.json   # Airport ATC frequencies (global dataset)
│   │       ├── firs_atc.json       # FIR (Flight Information Region) frequencies
│   │       └── greetings_atc.json  # Country/continent greeting phrases
│   └── icons/                      # App icons (SVG)
├── docs/
│   ├── overview.md                 # ← this file
│   ├── versioning.md               # Versioning system explained
│   ├── subdomain_routing.md        # Subdomain routing logic
│   ├── fake_atc.md                 # Fake ATC feature documentation
│   └── next_steps.md               # Future roadmap (in Slovak)
├── package.json                    # Version, dependencies, npm scripts
├── next.config.ts                  # Next.js configuration (minimal)
└── tsconfig.json                   # TypeScript config
```

---

## 6. Page Routes

### 6.1 Landing Page — `(landing)/page.tsx`

- Fetches `/api/datasets` to discover available aircraft.
- Renders a button for each aircraft (e.g., B738) linking to `/{aircraft}`.
- Also links to the Dataset Creator (`/creator`).

### 6.2 Checklist Page — `(checklist)/[aircraft]/page.tsx`

This is the main application page. It is a client component (`"use client"`) that:

1. **Renders the full HTML shell** into a `<div ref={containerRef}>` using `innerHTML` (the `getOriginalHTML()` function). This includes the top bar, settings panel, Flight Briefing overlay, voice bar, action timer, etc.

2. **Loads scripts sequentially** (order matters):
   - `/{aircraft_dataset}.js` — the checklist data file (sets `window.initialChecklistData`)
   - `/lang.js` — help guide translations (sets `window.HELP_TRANSLATIONS`)
   - `/script.js?v={APP_VERSION}` — the core engine (version query param busts cache)

3. After all scripts load, `script.js` calls `init()` which boots the entire checklist.

**Why this architecture?** The checklist was originally a pure HTML/JS app. The Next.js wrapper was added later to enable routing, API routes, and Vercel deployment, while keeping the proven vanilla JS engine intact.

### 6.3 API Routes

All API routes are server-side Next.js Route Handlers in `src/app/api/`:

| Route | Method | Purpose |
|---|---|---|
| `/api/datasets` | GET | Scans `public/data/` for aircraft subdirectories and their `.js` dataset files |
| `/api/airports?icao=XXXX` | GET | Returns ATC frequencies for a given ICAO airport code from `airports_atc.json` |
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
        "timerWarning": "some item"     // Optional: warning item name for timer
      }
    ]
  }
]
```

### Item Types

| `type` | Description |
|---|---|
| `flow` | Cockpit flow item (pre-checklist action) |
| `checklist item` | Standard challenge-response checklist item |
| `briefing` | Dynamic text block populated from Flight Briefing fields |
| `fake_atc` | Simulated ATC radio communication block |

### Variable Substitution in Item Names/Actions

Items can embed briefing variables using `%variable_name%` syntax. These are resolved at render time from the Flight Briefing fields. Examples:
- `"MCP V2 %v2%"` → `"MCP V2 148"` (when V2 = 148 is entered)
- `"EFIS BARO %dep_qnh%"` → `"EFIS BARO 1013"`

---

## 8. The Core Engine — `public/script.js`

This is the heart of the application (~3100 lines of vanilla JavaScript). It runs entirely in the browser global scope. Key responsibilities:

### 8.1 Initialization (`init()`)
Called once after all scripts load. Sets up:
- Checklist data (`checklistData = initialChecklistData`)
- UI toggles visibility (flow/test/simplify/briefing/fake_atc options)
- Loads briefing from `localStorage`
- Loads ATC data
- Calls `renderPage(true)` to draw the first page

### 8.2 Rendering (`renderPage()`)
Rebuilds the DOM checklist from scratch on every state change. Key logic:
- Filters items via `isItemVisible()` (respects all toggles: simplify, hide tests, checklist only, briefing enabled, fake ATC enabled, landing type)
- Marks the **first unchecked visible item** as `active` (bold/highlighted)
- Groups items with section subtitles (Flow / Briefing / ATC / Checklist items)
- Renders briefing items as multi-sentence text blocks
- Renders fake_atc items with `#atc` / `#pm` role tagging for visual differentiation

### 8.3 Settings & Persistence
All user preferences are stored in `localStorage`:

| Key | Setting |
|---|---|
| `b738_theme` | `"dark"` / `"light"` |
| `b738_mono` | `"true"` / `"false"` — monospace font |
| `b738_muted` | `"true"` / `"false"` |
| `b738_male_voice` | `"true"` / `"false"` |
| `b738_briefing_enabled` | Show briefing items |
| `b738_fake_atc_enabled` | Show fake ATC items |
| `b738_read_cl_only` | Voice reads checklist items only (not flows) |
| `b738_disable_timer` | Disable action timers |
| `b738_dataset` | Last selected dataset file path |
| `b738_briefing_v2` | Flight Briefing field values (JSON) |
| `b738_help_lang` | Help guide language |

### 8.4 Voice Engine (Web Speech API)
- **Speech Synthesis** — reads checklist items aloud using `window.speechSynthesis`
- **Speech Recognition** — voice commands via `window.SpeechRecognition`
- The engine supports automatic NATO phonetic spelling of abbreviations (IRS → "India Romeo Sierra"), number digit-by-digit reading, and custom phrase replacements
- Voice gender is user-selectable (male/female) via preferred voice name lists
- For `fake_atc` items, the ATC voice uses the **opposite gender** from the pilot voice for realism
- Manual pause can be inserted in text using `|` character in the dataset

### 8.5 Flight Briefing
- A floating draggable panel with fields for departure/arrival data
- All fields auto-save to `localStorage` on every keystroke
- Data is referenced by checklist items using `%variable%` placeholders
- **SimBrief sync** (`/api/simbrief`) auto-fills most fields from an active flight plan
- **METAR sync** (`/api/atis`) fetches live VATSIM ATIS code and weather

### 8.6 Fake ATC Engine
- Loaded via `loadAtcData()` which fetches three JSON files in parallel
- `updateAtcVariables()` processes origin/destination ICAO codes and resolves:
  - ATC callsigns and frequencies (DEL → GND → TWR → APP → FIR fallback chain)
  - City names for the airport
  - Localized greeting/farewell phrases (`greetings_atc.json`)
  - FIR coverage for airports not in the local dataset
- ATC variables are available as `%delivery_dep%`, `%ground_dep_freq%`, `%tower_arr%`, `%hello_dep%`, `%bye_arr%`, etc.
- Sentences prefixed with `#atc` are spoken in the opposite-gender voice and displayed in a distinct color

### 8.7 Action Timer
- Circular SVG countdown timer overlay, draggable, launched when a timed item is checked
- Two modes: auto-hide on completion, or stay-on-screen (continuous mode) until closed manually
- Voice integration: timer can delay the next voice read until it completes

---

## 9. Dataset Creator (`public/creator.html`)

A standalone single-file HTML/JS/CSS application for creating and editing checklist datasets. Accessible at:
- `creator.charlie-lima.eu` (via subdomain middleware rewrite to `/creator.html`)
- `charlie-lima.eu/creator` (via Next.js creator route)

The creator exports `.js` files compatible with the dataset format described in Section 7.

---

## 10. Multi-language Support

The file `public/lang.js` sets `window.HELP_TRANSLATIONS` — an object keyed by language code (`en`, `de`, `it`, `es`, `cz`, `pl`, `hu`, `fr`). The Help Guide panel switches content based on the user's selection, which is persisted in `localStorage` (`b738_help_lang`).

---

## 11. PWA Support

The app is configured as a **Progressive Web App**:
- `public/manifest.json` — defines app name, icons, display mode
- `src/app/layout.tsx` — sets `appleWebApp: { capable: true }` for iOS home-screen support
- `viewport` is locked (no user scaling) for a native-app feel on mobile

---

## 12. Key Conventions for Developers

1. **Never edit `script.js` through Next.js bundling** — it lives in `public/` and is loaded as a plain `<script>` tag at runtime.
2. **Version is set only in `package.json`** — it propagates automatically to cache-busting and the footer display. See `docs/versioning.md`.
3. **Adding a new aircraft** — create a new subdirectory in `public/data/{aircraft}/` with at least one `.js` dataset file. The `/api/datasets` route discovers it automatically.
4. **Adding new briefing variables** — add the field `id` to the `BRIEF_FIELDS` array in `script.js` and add the corresponding `<input>` element in `page.tsx`'s `getOriginalHTML()` function.
5. **Adding new ATC variables** — add the variable name to the `atcVarNames` array in `getFakeAtcValidSentences()` in `script.js`, and populate it in `updateAtcVariables()`.
6. **Styles** — primary styles are in `public/styles.css` (loaded by the checklist page). Global Next.js styles (CSS variables, body defaults) are in `src/app/globals.css`.

---

*Last updated: 2026-05-09*
