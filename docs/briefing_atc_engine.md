# Flight Briefing & ATC Variable Engine

This document describes the technical implementation of the Flight Briefing notepad and the underlying ATC variable resolution engine in Charlie-Lima.

---

## 1. The Flight Briefing Notepad

The Flight Briefing notepad (often referred to as the "Notepad" or "Briefing") is the primary input source for dynamic checklist data.

- **Storage:** All fields are automatically saved to `localStorage` under the key `b738_briefing_v2` on every keystroke.
- **Syncing:** Data is synced across the application using `saveBriefing()`, which triggers an update of all checklist placeholders.
- **Auto-Fill:** Fields can be auto-populated from:
  - **SimBrief:** Live flight plan data.
  - **VATSIM/METAR:** Real-world weather and ATIS information.
  - **ATC Database:** Static data like Transition Altitudes (TA) and ILS frequencies.

---

## 2. Data Source Hierarchy

When resolving airport-specific data (frequencies, callsigns, altitudes), the engine follows a strict multi-layered hierarchy to ensure the most accurate data is used:

1.  **SimBrief / Manual Input:** User-entered data or SimBrief imports always have the highest priority.
2.  **Live METAR:** Real-time weather data (QNH, Temperature).
3.  **Regional Database (`airports_database/`):** Detailed regional JSON files (Europe, North America, etc.) containing high-fidelity airport data.
4.  **Legacy Database (`airports_atc.json`):** A simplified global dataset used as a fallback for airports not covered in the regional files.
5.  **FIR Database (`FIRs.json`):** Standardized Flight Information Region callsigns and frequencies.
6.  **Universal Fallback:** Logic-based defaults (e.g., standard 10,000ft Transition Altitude for EU regions).

---

## 3. Smart Loading System

To optimize performance and memory usage, the application does not load the entire global database at once. Instead, it uses **prefix-based on-demand loading**:

| ICAO Prefix | Database File |
|---|---|
| `E`, `L` (most) | `Europe.json` |
| `K, C`, `PA` | `North_America.json` |
| `S, M, T` | `South_Latin_America.json` |
| `F, D, G, H` | `Africa.json` |
| `O, V, Z, U`, `LC, LL, LT` | `Middle_East.json` |
| `R, Y, N, A, P` (most) | `Pacific_Australia.json` |

When a user enters an ICAO code, the engine checks its cache (`atcData.newDb`). If the relevant continent file isn't loaded, it fetches it, indexes it by ICAO, and then resolves the data.

---

## 4. Frequency Fallback Logic (Proximity Chain)

In real-world aviation, if a specific ATC station is closed, another controller usually takes over its responsibilities. Charlie-Lima simulates this with a "Proximity Fallback" logic.

### 4.1 Departure Phase
For departure-side variables (`_dep`), the hierarchy flows "upwards" from the ground to the air:

- **Delivery:** `DEL` → `GND` → `TWR` → `APP_DEP` → `APP_ARR` → `FIR`
- **Ground:** `GND` → `TWR` → `APP_DEP` → `APP_ARR` → `FIR`
- **Tower:** `TWR` → `APP_DEP` → `APP_ARR` → `FIR`
- **Approach/Departure:** `APP_DEP` → `APP_ARR` → `FIR`

### 4.2 Arrival Phase
For arrival-side variables (`_arr`), the hierarchy flows "downwards" from the air to the ground:

- **Approach:** `APP_ARR` → `APP_DEP` → `FIR`
- **Tower:** `TWR` → `APP_ARR` → `APP_DEP` → `FIR`
- **Ground:** `GND` → `TWR` → `APP_ARR` → `APP_DEP` → `FIR`

*Note: If a specific Arrival controller is missing, the system checks for a Departure controller (`APP_DEP`) before falling back to the FIR.*
*Note: FIR (Center) serves as the ultimate fallback for ALL positions if no local frequency is found in the database.*

---

## 5. Regional Formatting Rules

The engine applies localized naming conventions based on the airport's country code:

- **Radar Rule (Central Europe):** In `CZ`, `SK`, `DE`, `AT`, and `HU`, the suffix **"Approach"** is automatically replaced with **"Radar"** (e.g., "Bratislava Approach" → "Bratislava Radar").
- **Center Rule (US/CAN/AUS):** In `US`, `CA`, and `AU`, the suffixes **"Radar"** or **"Control"** for FIR stations are replaced with **"Center"** (e.g., "New York Control" → "New York Center").

---

## 6. Variable Reference Table

These variables can be used in any checklist item or `fake_atc` block using the `%variable%` syntax.

### 6.1 ATC Station Variables
| Variable | Spoken Content |
|---|---|
| `%delivery_dep%` / `_freq%` | Clearance Delivery callsign & frequency |
| `%ground_dep%` / `_freq%` | Ground callsign & frequency (Departure) |
| `%tower_dep%` / `_freq%` | Tower callsign & frequency (Departure) |
| `%approach_dep%` / `_freq%` | Departure Approach/Radar callsign & frequency |
| `%fir_dep%` / `_freq%` | FIR/Center callsign & frequency (Departure) |
| `%approach_arr%` / `_freq%` | Arrival Approach/Radar callsign & frequency |
| `%tower_arr%` / `_freq%` | Tower callsign & frequency (Arrival) |
| `%ground_arr%` / `_freq%` | Ground callsign & frequency (Arrival) |
| `%fir_arr%` / `_freq%` | FIR/Center callsign & frequency (Arrival) |

### 6.2 Geography & Greetings
| Variable | Content |
|---|---|
| `%city_dep%` | Departure city name |
| `%city_arr%` | Arrival city name |
| `%hello_dep%` | Localized greeting (e.g., "Dobry den") |
| `%bye_dep%` | Localized farewell (e.g., "Dovidenia") |
| `%hello_arr%` / `%bye_arr%` | Localized greeting/farewell for arrival region |

---

## 7. Placeholder Auto-Fill Logic

When an airport is resolved, the engine automatically populates the **placeholders** in the Briefing UI if they are empty:

- **Transition Altitude (TA):** If `TA` exists in the database, it is set as the placeholder for the `b-dep-tl` and `b-initial-alt` fields.
- **Initial Altitude (INIT ALT):** The engine first looks for runway-specific initial climb data (`RWY_xx_INIT_CLIMB`). If missing, it uses a regional default (e.g., `18,000ft` for North American `K` prefixes).
- **FAP Altitude:** Fetched from the `RWY_xx_ILS.ALT` field for the selected arrival runway.
- **ILS Data:** The database contains `RWY_ILS_FRQ` and `RWY_ILS_CRS` for specific runways. This data is used for automatic frequency/course suggestion when a runway is selected.

---

## 8. Airline Callsign Mapping

To improve the realism of voice synthesis, the engine includes a mapping of ICAO airline prefixes to their spoken telephony callsigns.

- **Mechanism:** When a callsign is spoken (in `fake_atc` or briefing), the engine checks the 3-letter prefix against a dictionary (e.g., `RYR` → `"Ryanair"`, `BAW` → `"Speedbird"`, `TVQ` → `"Smartwings"`).
- **Fallback:** If no match is found, the callsign is spoken as-is or character-by-character if it contains numbers.

---

*Last updated: 2026-05-10*
