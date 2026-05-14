# Fake ATC — Feature Documentation

This document describes how the Fake ATC feature works in the Charlie-Lima application — its data sources, variable system, voice rendering, and dataset authoring format.

---

## 1. What is Fake ATC?

Fake ATC is a voice simulation feature that plays scripted radio communication dialogues between the pilot (PM) and simulated ATC controllers. It uses the Web Speech API and the flight data entered in the Flight Briefing notepad to generate dynamic, realistic-sounding radio exchanges.

It is primarily an **audio feature** — the dialogue text is visible in the checklist as a reference, but its main purpose is to be spoken aloud by the voice engine.

---

## 2. Enabling the Feature

Fake ATC is toggled via the **Settings panel** (gear icon in the top bar) using the **Fake ATC** toggle switch.

| Property | Value |
|---|---|
| **Persistence** | `b738_fake_atc_enabled` |
| **Default** | `false` (disabled) |

- When enabled for the first time, an info popup appears explaining what the feature requires (origin/destination in the briefing notepad). This popup can be permanently dismissed with "Do not show again", stored under `b738_fake_atc_popup_seen`.
- When disabled, all `fake_atc` type items are hidden from the checklist as if they don't exist.
- The popup state is **independent** from the equivalent briefing popup setting.

---

## 3. Data Loading

The Fake ATC system loads data client-side at runtime via `loadAtcData()`, which fetches **four JSON files in parallel**:

```js
Promise.all([
    fetch('/data/atc/airports_atc.json'),      // Legacy airport frequencies
    fetch('/data/atc/firs_atc.json'),           // Legacy FIR frequencies
    fetch('/data/atc/greetings_atc.json'),      // Country/continent greetings
    fetch('/data/atc/airports_database/FIRs.json')  // New FIR database
])
```

After loading, `updateAtcVariables()` is called to resolve all ATC variables based on the current Origin and Destination fields.

Additionally, when an ICAO code is entered, the engine **lazily loads** the relevant regional database file (e.g., `Europe.json`) via `getNewDbAirport()`. See [Briefing & ATC Engine](briefing_atc_engine.md) §3 for the smart loading system.

---

## 4. Data Source Hierarchy

| Priority | Source | Location | Purpose |
|---|---|---|---|
| 1 | **SimBrief / Manual** | User input | Highest priority — user-entered data |
| 2 | **Regional Database** | `public/data/atc/airports_database/*.json` | High-fidelity regional airport data |
| 3 | **Legacy Database** | `public/data/atc/airports_atc.json` | Fallback for airports not in regional DB |
| 4 | **New FIR Database** | `public/data/atc/airports_database/FIRs.json` | Standardized FIR callsigns & frequencies |
| 5 | **Legacy FIR Database** | `public/data/atc/firs_atc.json` | Fallback FIR data |
| 6 | **Greetings** | `public/data/atc/greetings_atc.json` | Localized hello/goodbye phrases |
| 7 | **Universal Fallback** | Code logic | ICAO code used as city, no frequencies |

For the full technical breakdown of data merging and fallback logic, see [Briefing & ATC Engine](briefing_atc_engine.md).

---

## 5. Regional Databases (`airports_database/`)

Instead of loading one massive global file, the application uses **smart loading** based on the ICAO prefix:

| ICAO Prefix | File | Size |
|---|---|---|
| `E`, `L` (most) | `Europe.json` | ~500 KB |
| `K`, `C`, `PA` | `North_America.json` | ~388 KB |
| `S`, `M`, `T` | `South_Latin_America.json` | ~168 KB |
| `F`, `D`, `G`, `H` | `Africa.json` | ~200 KB |
| `O`, `V`, `Z`, `U`, `LC`, `LL`, `LT` | `Middle_East.json` | ~265 KB |
| `R`, `Y`, `N`, `A`, `P` (most) | `Pacific_Australia.json` | ~214 KB |

Each regional file is an array of airport objects. The engine indexes them by `CODE_ICAO` after first load for O(1) lookup.

### 5.1 New Database Entry Format

```json
{
    "CODE_ICAO": "LKPR",
    "CITY": "Prague",
    "COUNTRY_CODE": "CZ",
    "CALLSIGN": "Ruzyne",
    "FIR_ICAO": "LKAA",
    "TA": "5000",
    "DEL": "Ruzyne Delivery",
    "DEL_FRQ": "120.055",
    "GND": "Ruzyne Ground",
    "GND_FRQ": "121.905",
    "TWR": "Ruzyne Tower",
    "TWR_FRQ": "118.105",
    "APP_DEP": "Praha Radar",
    "APP_DEP_FRQ": "120.530",
    "APP_ARR": "Praha Radar",
    "APP_ARR_FRQ": "127.580",
    "INIT_CLIMB": "5000",
    "RWY06_ILS_FRQ": "110.30",
    "RWY06_ILS_CRS": "064",
    "RWY06_ILS.ALT": "2500",
    "RWY24_ILS_FRQ": "111.15",
    "RWY24_ILS_CRS": "244",
    "RWY24_ILS.ALT": "3000"
}
```

**Key fields:**
- `CODE_ICAO` — 4-letter ICAO airport code (primary key)
- `CITY` — City name for display and TTS
- `COUNTRY_CODE` — ISO 3166-1 alpha-2 code (used for greetings and naming rules)
- `CALLSIGN` — Base callsign for the airport (used as fallback when specific station callsign is `-`)
- `FIR_ICAO` — FIR code for FIR frequency lookup
- `TA` — Transition Altitude
- `DEL`/`GND`/`TWR`/`APP_DEP`/`APP_ARR` — Station-specific callsigns
- `*_FRQ` — Corresponding frequencies
- `RWY{xx}_ILS_FRQ/CRS` — ILS data per runway
- `RWY{xx}_ILS.ALT` — FAP altitude per runway
- `INIT_CLIMB` / `RWY_{xx}_INIT_CLIMB` — Initial climb altitude
- Value of `"-"` means "not available"

### 5.2 Legacy Database Entry Format

```json
"LKPR": {
    "name": "Václav Havel Airport Prague",
    "city": "Prague",
    "country": "CZ",
    "continent": "EU",
    "fir": "LKAA",
    "frequencies": [
        { "type": "DEL", "callsign": "Ruzyne Delivery", "frequency": "120.055" },
        { "type": "GND", "callsign": "Ruzyne Ground",   "frequency": "121.905" },
        { "type": "TWR", "callsign": "Ruzyne Tower",    "frequency": "118.105" },
        { "type": "APP", "role": "DEP", "callsign": "Praha Radar", "frequency": "120.530" },
        { "type": "APP", "role": "ARR", "callsign": "Praha Radar", "frequency": "127.580" }
    ]
}
```

---

## 6. FIR Data Format

### New Format (`airports_database/FIRs.json`)
```json
"LKAA": {
    "CALLSIGN": "Praha Radar",
    "MAIN_FRQ": "120.900"
}
```

### Legacy Format (`firs_atc.json`)
```json
"LKAA": {
    "name": "Praha",
    "callsign": "Praha Radar",
    "frequency": "120.900"
}
```

Each FIR entry provides a single callsign and frequency used as the ultimate fallback for any airport that lacks local frequency coverage.

**Special rule:** For airports in `US`, `CA`, or `AU`, the word "Radar" or "Control" in a FIR callsign is automatically replaced with "Center" at runtime.

---

## 7. Greetings Data Format (`greetings_atc.json`)

```json
{
    "countries": {
        "SK": { "hello": "Dobry den", "bye": "Dovidenia" },
        "CZ": { "hello": "Dobry den", "bye": "Nashledanou" },
        "DE": { "hello": "Guten Tag", "bye": "Auf Wiedersehen" }
    },
    "continents": {
        "EU": { "hello": "Good day", "bye": "Goodbye" },
        "NA": { "hello": "Hello",    "bye": "Goodbye" }
    }
}
```

### Greeting Resolution Order
1. Look up `greetings_atc.countries[airport.country]`
2. If not found, fall back to `greetings_atc.continents[airport.continent]`
3. If neither exists, default to `hello = "Hello"` / `bye = "Goodbye"`

> **TTS Note:** Greetings are stored **without diacritics** so that TTS engines pronounce them with a natural foreign accent rather than mispronouncing Unicode characters.

---

## 8. ATC Variable Resolution

When the origin or destination ICAO field changes, `updateAtcVariables()` is called asynchronously (via `saveBriefing()`). This function:

1. **Clears** all existing ATC variables
2. **Processes departure airport** (async — may trigger regional DB load)
3. **Processes arrival airport** (async — may trigger regional DB load)

For each airport:
1. Loads the relevant regional JSON if not already cached
2. Maps new DB format to internal format (frequencies array, ILS data, etc.)
3. Falls back to legacy DB if not found in regional DB
4. Creates universal fallback object if not found anywhere
5. Sets city name, greeting variables
6. Auto-fills empty Briefing fields (TA, Init ALT, FAP ALT, ILS)
7. Resolves frequencies using the proximity fallback chain
8. Resolves FIR callsign and frequency from FIR databases
9. Applies FIR fallback for any missing station variables

### Output Variables

The function produces the following variables stored in the `atcVariables` object:

| Variable Group | Variables |
|---|---|
| **Departure Stations** | `delivery_dep`, `delivery_dep_freq`, `ground_dep`, `ground_dep_freq`, `tower_dep`, `tower_dep_freq`, `approach_dep`, `approach_dep_freq`, `fir_dep`, `fir_dep_freq` |
| **Arrival Stations** | `approach_arr`, `approach_arr_freq`, `tower_arr`, `tower_arr_freq`, `ground_arr`, `ground_arr_freq`, `fir_arr`, `fir_arr_freq` |
| **Geography** | `city_dep`, `city_arr` |
| **Greetings** | `hello_dep`, `bye_dep`, `hello_arr`, `bye_arr` |

---

## 9. Item Visibility Rules

A `fake_atc` item is **visible** only if:
1. The Fake ATC toggle is enabled (`isFakeAtcEnabled === true`)
2. `getFakeAtcValidSentences()` returns at least one sentence with all its variables resolved

### Sentence Resolution Logic

For each sentence in the item's `text` array:
1. **Replace briefing variables** (`%callsign%`, `%dep_rwy%`, etc.) from input field values
2. **Replace ATC variables** (`%delivery_dep%`, `%city_arr%`, etc.) from `atcVariables`
3. If the sentence contains ANY variable and ALL variables are resolved → **include it**
4. If the sentence contains ANY variable but some are MISSING → **silently drop it**
5. If the sentence contains NO variables → **always include it**
6. If at least one sentence with variables was successfully resolved → return all included sentences
7. If NO sentence with variables was resolved → return empty array (item is hidden)

This allows **graceful degradation** — incomplete flight data just removes specific calls from the dialogue without breaking anything.

---

## 10. Voice Rendering

### 10.1 Role Tags

Each sentence in a `fake_atc` item is prefixed with a role tag that determines which voice reads it:

| Tag | Speaker | Voice |
|---|---|---|
| `#pm` | Pilot Monitoring (you) | Selected pilot voice (male or female per setting) |
| `#atc` | ATC controller | Opposite gender from the pilot voice |
| *(no tag)* | Pilot Monitoring | Defaults to `pm` role |

The tags themselves are **never spoken** — they are stripped before the text is passed to the TTS engine.

### 10.2 The Pause Tag

The `#pause` tag can be used on its own line to insert a natural delay (~2000ms) between dialogue exchanges. This is typically used to simulate the time it takes to change frequencies during a handover.

When the UI renders the dialogue block, the `#pause` tag is hidden and replaced with a visual paragraph break (extra margin).

### 10.3 Voice Gender Logic

```
User setting: Male Voice = ON
  → #pm sentences: male voice (rate 1.28)
  → #atc sentences: female voice (rate 1.09)

User setting: Male Voice = OFF
  → #pm sentences: female voice (rate 1.09)
  → #atc sentences: male voice (rate 1.28)
```

This ensures ATC always sounds like a different person from the pilot.

### 10.4 Pause Character `|`

A `|` character in a sentence inserts a 500ms silence pause at that point in the audio. This allows adding natural cadence to longer radio calls.

Example: `"#atc Cleared to %city_arr% | via %sid% | runway %dep_rwy%."` — each phrase is separated by a half-second pause.

**Implementation:** The `|` is processed at playback time by splitting the sentence into sub-utterances with 500ms delay intervals between them.

### 10.5 Phonetic Processing

All `fake_atc` text passes through `spellAbbreviations()` and `parseVariables()` before TTS:
- Callsigns are expanded to telephony names (e.g., `RYR123` → "Ryanair one two three")
- Frequencies are read with "decimal" (e.g., `118.1` → "one one eight decimal one")
- Runways are expanded (e.g., `04L` → "zero four Left")
- ATIS letters are NATO-spelled (e.g., `B` → "Bravo")
- Numbers are read digit-by-digit (e.g., `4500` → "four five zero zero")

### 10.6 Playback Flow

1. User clicks the play icon on a `fake_atc` item (or the voice engine reaches it automatically).
2. The item is marked as "currently playing" (`currentPlayingBriefingIndex = itemIndex`).
3. The UI re-renders with a stop icon and visual "checked" styling while playing.
4. All sentences are queued with their roles and played sequentially via `playNextUtterance()`.
5. When all sentences finish, `simulateCheckAction()` is called — the item is marked as checked and the engine advances to the next item.
6. Clicking the item again while it's playing cancels playback, unchecks it, and increments the session counter to kill orphaned queues.

### 10.7 Interaction with Read CL Only Mode

In **Read CL Only** mode, `fake_atc` items behave like `briefing` items — the voice engine pauses before them and waits for the user to manually trigger playback. They are not auto-read in sequence with checklist items. Right-clicking them simply checks them off without playing audio.

---

## 11. Authoring `fake_atc` Items in a Dataset

### 11.1 Item Structure

```json
{
    "type": "fake_atc",
    "text": [
        "#pm %delivery_dep% %hello_dep% %callsign%",
        "#pm at stand %dep_gate%",
        "#pm with information %dep_atis%",
        "#pm requesting clearance to %city_arr%.",
        "#atc %callsign% | cleared to %city_arr%",
        "#atc via %sid%",
        "#atc runway %dep_rwy%",
        "#atc squawk %squawk%.",
        "#pm Cleared to %city_arr% | %sid% | runway %dep_rwy% | squawk %squawk% | %callsign%",
        "#atc %callsign% readback correct."
    ]
}
```

### 11.2 Rules

- `type` must be exactly `"fake_atc"`
- `text` is an array of strings — each string is one sentence
- Each sentence is either shown and spoken, or silently dropped if its variables aren't filled
- Sentences with no variables are always shown and always spoken
- Use `#atc` or `#pm` prefix to assign the speaker role (default: `#pm`)
- Use `#pause` as a standalone sentence to insert a 2-second delay
- Use `|` within a sentence to insert 500ms pauses
- Sentences do **not** need a `name` or `action` field — `fake_atc` items have no challenge/response structure

### 11.3 Available Variables

All variables listed in [Briefing & ATC Engine](briefing_atc_engine.md) §6 are available, including:
- **ATC variables:** `%delivery_dep%`, `%ground_dep_freq%`, `%tower_arr%`, `%fir_dep%`, etc.
- **Geography:** `%city_dep%`, `%city_arr%`
- **Greetings:** `%hello_dep%`, `%bye_dep%`, `%hello_arr%`, `%bye_arr%`
- **Briefing variables:** `%callsign%`, `%dep_rwy%`, `%squawk%`, `%sid%`, `%initial_alt%`, `%dep_atis%`, `%dep_gate%`, etc.

### 11.4 Variable Availability Requirement

A sentence is only included if **all** variables within it are resolved. This means:
- If `%dep_gate%` is empty in the briefing, any sentence containing `%dep_gate%` will be silently skipped.
- This allows graceful degradation — incomplete flight data just removes those specific calls from the dialogue, without breaking anything.

### 11.5 Conditional Blocks (Fallbacks)

You can use conditional `[IF]` blocks to hide portions of the communication if a fallback occurs (e.g., if Delivery falls back to Ground, preventing a redundant handoff from Ground to Ground).

**Syntax:**
```json
"[IF %delivery_dep% != %ground_dep%]",
"#atc contact %ground_dep% %ground_dep_freq%",
"[ENDIF]"
```
- The `[IF %var1% != %var2%]` block evaluates if the two variables are different.
- If they are the same (due to a fallback where both variables resolve to the exact same station callsign), all sentences between `[IF]` and `[ENDIF]` are completely ignored.
- You can also use `==` if needed: `[IF %var1% == %var2%]`.
- This works flawlessly across multi-level fallbacks (e.g. DEL -> GND -> TWR -> APP -> FIR).

### 11.6 Conditional Flags

`fake_atc` items support the same flags as other items:
- `"landingtype": "2+3"` — only visible for ILS approaches
- `"subtype": "simplify"` — hidden in Simplify mode
- `"ifturnaround": "skip"` — auto-checked in Turnaround mode

---

## 12. Display in the Checklist UI

`fake_atc` items render differently from standard checklist items:

| Aspect | Behavior |
|---|---|
| **Layout** | No `name ... action` dot-leader layout; full text block |
| **PM lines** | Standard text color |
| **ATC lines** | Bold italic, accent color (class `atc-voice-text`) |
| **Pause breaks** | Rendered as empty `<div>` with 8px top margin |
| **Checkbox** | Play ▶ / Stop ■ icon instead of standard checkbox |
| **Checked state** | Opacity reduced, no strikethrough (text remains fully readable) |
| **Active state** | Normal font weight (not bold like regular items) |
| **Section marker** | "ATC" subtitle appears above first `fake_atc` item on a page |

---

*Last updated: 2026-05-10*
