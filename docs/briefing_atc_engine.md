# Flight Briefing & ATC Variable Engine

This document describes the technical implementation of the Flight Briefing notepad and the underlying ATC variable resolution engine in Charlie-Lima.

---

## 1. The Flight Briefing Notepad

The Flight Briefing notepad is the primary input source for dynamic checklist data. It is a draggable floating panel accessible via the FAB button (✈️ icon).

### 1.1 Fields

The notepad contains **40+ input fields** organized into three sections:

| Section | Fields |
|---|---|
| **Header** | Callsign, Origin (ICAO), Destination (ICAO), SimBrief ID |
| **Departure** | ATIS, QNH, RWY, RWY HDG, SID, Gate, Init ALT, Cruise ALT, TA, Squawk, Dew Pt, Temp, Wind, Total Fuel, Trip Fuel, Reserve, V1, VR, V2, Trim, Flaps, Assumed Temp, Taxi Out |
| **Arrival** | ATIS, QNH, RWY, Approach Type (ILS Cat.III / ILS Cat.I/II / RNAV), TL, STAR, Dew Pt, Temp, Wind, ILS Freq, Course, FAP ALT, Minima, GA ALT, VREF, Flaps, Autobrake, Taxi In, Gate |
| **Notes** | Free-text textarea |

### 1.2 Storage & Syncing
- **Storage:** All fields are automatically saved to `localStorage` under the key `b738_briefing_v2` on every keystroke (`input` event).
- **Syncing:** Data is synced across the application using `saveBriefing()`, which:
  1. Serializes all field values to `localStorage`
  2. Updates the global flight info bar (`RYR123 | LZIB > EGLL`)
  3. Calls `updateAtcVariables()` (async) to refresh ATC data
  4. Calls `updateChecklistVariablesUI()` to update in-place text in the DOM
  5. Calls `renderPage(false)` to re-evaluate item visibility (briefing items may appear/disappear)

### 1.3 Approach Type Dropdown
The Approach Type field uses a **custom dropdown** (not a native `<select>`) for visual consistency:
- Three options: `ILS Cat.III` (value `3`), `ILS Cat.I/II` (value `2`), `RNAV` (value `1`)
- Default: `ILS Cat.III` (displayed with the `unfilled` CSS class until explicitly selected)
- Changing the approach type triggers `renderPage()` — items with `landingtype` restrictions are shown/hidden accordingly

### 1.4 Auto-Fill Sources
Fields can be auto-populated from multiple sources:

| Source | Trigger | Fields Populated |
|---|---|---|
| **SimBrief** | User clicks Sync button | All flight plan data (see §5) |
| **VATSIM METAR** | ICAO change or manual Sync METAR | ATIS letter, QNH, Temp, Dewpoint, Wind |
| **ATC Database** | ICAO change (via `updateAtcVariables()`) | TA, Initial Altitude, FAP ALT, ILS Freq, Course |
| **Squawk Generator** | User clicks 🎲 button | Random 4-digit octal squawk |

### 1.5 Mobile Accordion
On viewports ≤700px, the Departure and Arrival sections operate in **Accordion** mode:
- Opening one automatically collapses the other to maximize vertical space
- On desktop (>700px), both sections remain open simultaneously

### 1.6 Clear All
The "Clear All" button (with confirmation dialog) empties all fields, removes `b738_briefing_v2` from localStorage, and refreshes the dropdown UI.

---

## 2. Data Source Hierarchy

When resolving airport-specific data (frequencies, callsigns, altitudes), the engine follows a strict multi-layered hierarchy to ensure the most accurate data is used:

```
┌──────────────────────────────────────────────────┐
│  Priority 1: SimBrief / Manual Input             │
│  (User-entered data always wins)                 │
├──────────────────────────────────────────────────┤
│  Priority 2: Live METAR (VATSIM)                 │
│  (Real-time QNH, Temperature, Wind, ATIS)        │
├──────────────────────────────────────────────────┤
│  Priority 3: Regional Database (airports_database)│
│  (High-fidelity: frequencies, TA, ILS, callsigns)│
├──────────────────────────────────────────────────┤
│  Priority 4: Legacy Database (airports_atc.json) │
│  (Simplified format, fallback for missing ICAO)  │
├──────────────────────────────────────────────────┤
│  Priority 5: FIR Database (FIRs.json)            │
│  (Flight Information Region callsigns & freq)    │
├──────────────────────────────────────────────────┤
│  Priority 6: Universal Fallback                  │
│  (ICAO code used as city name, no frequencies)   │
└──────────────────────────────────────────────────┘
```

**Implementation:** The `processAirport()` function inside `updateAtcVariables()` attempts to resolve data in this order:
1. Call `getNewDbAirport(icao)` — loads regional JSON if needed, returns indexed entry
2. If not found, check `atcData.airports[icao]` (legacy DB)
3. If neither found, create a minimal fallback object with just the ICAO code

---

## 3. Smart Loading System

To optimize performance and memory usage, the application does not load the entire global database at once. Instead, it uses **prefix-based on-demand loading**:

| ICAO Prefix | Database File | Approx. Size |
|---|---|---|
| `E`, `L` (most) | `Europe.json` | ~500 KB |
| `K`, `C`, `PA` | `North_America.json` | ~388 KB |
| `S`, `M`, `T` | `South_Latin_America.json` | ~168 KB |
| `F`, `D`, `G`, `H` | `Africa.json` | ~200 KB |
| `O`, `V`, `Z`, `U`, `LC`, `LL`, `LT` | `Middle_East.json` | ~265 KB |
| `R`, `Y`, `N`, `A`, `P` (most) | `Pacific_Australia.json` | ~214 KB |

**Special Cases:**
- `LC` (Cyprus), `LL` (Israel), `LT` (Turkey) are routed to `Middle_East.json` despite the `L` prefix
- `PA` (Alaska) is routed to `North_America.json` despite the `P` prefix

When a user enters an ICAO code, the engine:
1. Determines the continent file from the first 1-2 prefix characters
2. Checks the cache (`atcData.newDb[fileName]`)
3. If not cached, fetches the JSON, **indexes all entries by ICAO** for O(1) lookup
4. Returns the matched entry or `null`

**Cache structure:** `atcData.newDb` is a dictionary keyed by filename → dictionary keyed by ICAO → airport object.

---

## 4. Frequency Fallback Logic (Proximity Chain)

In real-world aviation, if a specific ATC station is closed, another controller usually takes over its responsibilities. Charlie-Lima simulates this with a "Proximity Fallback" logic.

### 4.1 Departure Phase
For departure-side variables (`_dep`), the hierarchy flows "upwards" from the ground to the air:

| Variable | Fallback Chain |
|---|---|
| `delivery_dep` | `DEL` → `GND` → `TWR` → `APP_DEP` → `APP_ARR` → `FIR` |
| `ground_dep` | `GND` → `TWR` → `APP_DEP` → `APP_ARR` → `FIR` |
| `tower_dep` | `TWR` → `APP_DEP` → `APP_ARR` → `FIR` |
| `approach_dep` | `APP_DEP` → `APP_ARR` → `FIR` |
| `fir_dep` | `FIR` *(direct from FIR database)* |

### 4.2 Arrival Phase
For arrival-side variables (`_arr`), the hierarchy flows "downwards" from the air to the ground:

| Variable | Fallback Chain |
|---|---|
| `approach_arr` | `APP_ARR` → `APP_DEP` → `FIR` |
| `tower_arr` | `TWR` → `APP_ARR` → `APP_DEP` → `FIR` |
| `ground_arr` | `GND` → `TWR` → `APP_ARR` → `APP_DEP` → `FIR` |
| `fir_arr` | `FIR` *(direct from FIR database)* |

> **Note:** FIR (Center) serves as the ultimate fallback for ALL positions if no local frequency is found in the database.

### 4.3 Callsign Suffix Logic

When the `setV()` function assigns a callsign, it automatically appends the correct ATC role suffix if missing:

| Frequency Type | Suffix Added | Exception |
|---|---|---|
| `DEL` | "Delivery" | Only if "delivery" not already in callsign |
| `GND` | "Ground" | Only if "ground" not already in callsign |
| `TWR` | "Tower" | Only if "tower" not already in callsign |
| `APP` | "Approach" or "Radar" | Based on region (see §5) |

All callsigns are formatted to **Title Case** using `toTitleCase()`.

---

## 5. Regional Formatting Rules

The engine applies localized naming conventions based on the airport's country code:

### 5.1 Radar Rule (Central Europe)
In `CZ`, `SK`, `DE`, `AT`, and `HU`, the suffix **"Approach"** is automatically replaced with **"Radar"**:
- "Bratislava Approach" → "Bratislava Radar"
- "Praha Approach" → "Praha Radar"

### 5.2 Center Rule (US/CAN/AUS)
In `US`, `CA`, and `AU`, the suffixes **"Radar"** or **"Control"** for FIR stations are replaced with **"Center"**:
- "New York Control" → "New York Center"
- "Sydney Radar" → "Sydney Center"

### 5.3 Initial Altitude Regional Defaults
When no specific initial climb altitude is found in the database, the engine uses region-based placeholder values:

| ICAO Prefix | Default Placeholder |
|---|---|
| `K` (US CONUS) | 18,000 ft |
| `PH` (Hawaii), `PA` (Alaska) | 18,000 ft |
| All others | 5,000 ft |

---

## 6. Variable Reference Table

These variables can be used in any checklist item or `fake_atc` block using the `%variable%` syntax.

### 6.1 ATC Station Variables

| Variable | Content |
|---|---|
| `%delivery_dep%` | Clearance Delivery callsign (departure) |
| `%delivery_dep_freq%` | Clearance Delivery frequency |
| `%ground_dep%` / `%ground_dep_freq%` | Ground callsign & frequency (departure) |
| `%tower_dep%` / `%tower_dep_freq%` | Tower callsign & frequency (departure) |
| `%approach_dep%` / `%approach_dep_freq%` | Departure Approach/Radar callsign & frequency |
| `%fir_dep%` / `%fir_dep_freq%` | FIR/Center callsign & frequency (departure) |
| `%approach_arr%` / `%approach_arr_freq%` | Arrival Approach/Radar callsign & frequency |
| `%tower_arr%` / `%tower_arr_freq%` | Tower callsign & frequency (arrival) |
| `%ground_arr%` / `%ground_arr_freq%` | Ground callsign & frequency (arrival) |
| `%fir_arr%` / `%fir_arr_freq%` | FIR/Center callsign & frequency (arrival) |

### 6.2 Geography & Greetings

| Variable | Content | Example |
|---|---|---|
| `%city_dep%` | Departure city name | "Bratislava" |
| `%city_arr%` | Arrival city name | "London" |
| `%hello_dep%` | Localized greeting at departure | "Dobry den" |
| `%bye_dep%` | Localized farewell at departure | "Dovidenia" |
| `%hello_arr%` | Localized greeting at arrival | "Good day" |
| `%bye_arr%` | Localized farewell at arrival | "Goodbye" |

### 6.3 Briefing Variables

All Flight Briefing input fields are accessible as variables using the field ID with the `b-` prefix removed and hyphens replaced by underscores:

| Variable | Source Field |
|---|---|
| `%callsign%` | Callsign |
| `%origin%` / `%dest%` | Origin / Destination ICAO |
| `%dep_atis%` / `%arr_atis%` | ATIS letter |
| `%dep_qnh%` / `%arr_qnh%` | QNH |
| `%dep_rwy%` / `%arr_rwy%` | Runway |
| `%dep_rwy_hdg%` | Runway heading |
| `%sid%` / `%star%` | SID / STAR |
| `%dep_gate%` / `%gate%` | Gate |
| `%initial_alt%` | Initial altitude |
| `%init_alt%` | Cruise altitude (FL) |
| `%dep_tl%` / `%arr_ta%` | Transition altitude / level |
| `%squawk%` | Squawk code |
| `%v1%` / `%vr%` / `%v2%` / `%vref%` | Speed references |
| `%trim%` | Takeoff trim |
| `%dep_flaps%` / `%arr_flaps%` | Flap settings |
| `%dep_assumed%` | Assumed temperature |
| `%total_fuel%` / `%trip_fuel%` / `%reserve_fuel%` | Fuel quantities |
| `%dep_temp%` / `%arr_temp%` | Temperature |
| `%dep_dewpt%` / `%arr_dewpt%` | Dewpoint |
| `%dep_wind%` / `%arr_wind%` | Wind (dir/speed) |
| `%ils_freq%` / `%course%` | ILS frequency & course |
| `%fap_alt%` / `%minima%` / `%ga_alt%` | Approach altitudes |
| `%landing_type%` | Approach type (displays as "ILS Cat 3" / "ILS" / "RNAV") |
| `%autobrake%` | Autobrake setting |
| `%taxi_out%` / `%taxi_in%` | Taxi routes |
| `%notes%` | Notes |

---

## 7. Placeholder & Auto-Fill Logic

When an airport is resolved, the engine automatically populates **placeholder values** in the Briefing UI if the fields are empty:

### 7.1 Auto-Fill Fields (value is set)

| Field | Source | Condition |
|---|---|---|
| **Transition Altitude** (`b-dep-tl`) | `newApt.TA` | Only if field is empty |
| **Initial Altitude** (`b-initial-alt`) | `newApt.RWY_{rwy}_INIT_CLIMB` or `newApt.INIT_CLIMB` | Only if field is empty |
| **FAP Altitude** (`b-fap-alt`) | `newApt.RWY{rwy}_ILS.ALT` | Only if field is empty |
| **ILS Frequency** (`b-ils-freq`) | `newApt.RWY_{rwy}_ILS_FRQ` | Only if field is empty |
| **Course** (`b-course`) | `newApt.RWY_{rwy}_ILS_CRS` | Only if field is empty |

> **Critical:** These auto-fill values are only set when the field is **completely empty** (value === ""). This prevents overwriting user-entered or SimBrief-imported data.

### 7.2 Placeholder Fields (visual hint only)
The **Initial Altitude** field additionally uses dynamic `placeholder` text based on the region (e.g., "18000" for US airports, "5000" for European).

### 7.3 Briefing Item Visibility
- A briefing line containing a variable (e.g., `%v1%`) is **automatically hidden** if that variable is empty in the notepad.
- A `fake_atc` sentence containing an unresolved variable is **silently dropped** from the dialogue.
- If ALL sentences in a briefing or fake_atc item are dropped, the entire item is hidden.

### 7.4 Conditional Tags `[IF ...]`
Briefing lines can be wrapped in a conditional block:
```
[IF Item Name] text [/IF]
```
The text will only appear if a checklist item with a matching name has been **checked off** by the user. This enables dynamic briefing content that adapts to the current checklist state.

---

## 8. Airline Callsign Mapping

To improve the realism of voice synthesis, the engine includes a mapping of ~50 ICAO airline prefixes to their spoken telephony callsigns.

- **Mechanism:** When a callsign is spoken (in `fake_atc` or briefing), the engine checks the alphabetic prefix against the `AIRLINE_CALLSIGNS` dictionary. Furthermore, all words from this dictionary are dynamically added to the `DONT_SPELL` exception set on load, ensuring that they are never spelled out using the NATO alphabet.
- **Examples:** `RYR` → "Ryanair", `BAW` → "Speedbird", `TVQ` → "Smartwings", `UAE` → "Emirates", `QTR` → "Qatari"
- **Suffixes:** The numeric suffix is preserved and appended (e.g., `RYR123` → "Ryanair 123")
- **Fallback:** If no match is found, the callsign is used as-is.

---

## 9. SimBrief Integration Details

### 9.1 Field Mapping
When SimBrief data is imported, fields are mapped using fallback chains:

| Briefing Field | SimBrief Path (priority order) |
|---|---|
| V1 | `vspeeds.v1` → `tlr.takeoff.runway[].speeds_v1` |
| VR | `vspeeds.vr` → `tlr.takeoff.runway[].speeds_vr` |
| V2 | `vspeeds.v2` → `tlr.takeoff.runway[].speeds_v2` |
| VREF | `vspeeds.vref` → `tlr.landing.distance_dry.speeds_vref` |
| Cruise ALT | `general.cruise_altitude` → `general.initial_altitude` → `params.cruise` → FL calculation |
| Dep Temp | METAR regex → `tlr.takeoff.conditions.temperature` → `weather.origin.temp` |

### 9.2 Autobrake Mapping
SimBrief uses various string formats for autobrake. The engine normalizes them:

| SimBrief Value | Mapped To |
|---|---|
| `MAX MAN` | `3` |
| `MAX` | `MAX` |
| `MED` | `3` |
| `MIN` / `LOW` | `1` |
| `{number}` | `{number}` |

### 9.3 Dynamic Runway Updates
After SimBrief import, runway-dependent fields (V-speeds, ILS, course, flaps) are recalculated when the user changes the runway field. The cached SimBrief data is stored in `window.simbriefData` and the recalculation function is exposed as `window.updateBriefingFromRwy`.

### 9.4 Post-Import Actions
After a successful SimBrief import, the engine automatically:
1. Saves all briefing fields (`saveBriefing()`)
2. Triggers METAR sync button click (`b-metar-sync`)
3. Syncs the approach type dropdown UI
4. Shows success alert

---

## 10. Squawk Generator

A utility button in the notepad generates a random 4-digit octal squawk code:
- Each digit is independently generated in the range 0-7
- **Excluded codes:** `7000`, `7500` (hijack), `7600` (comms failure), `7700` (emergency), `1200` (VFR), `2000` (non-discrete), `0000`
- The generated code is zero-padded to 4 digits (e.g., `0451`)

---

*Last updated: 2026-05-10*
