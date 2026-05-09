# Fake ATC — Feature Documentation

This document describes how the Fake ATC feature works in the Charlie-Lima application — its data sources, variable system, voice rendering, and dataset authoring format.

---

## 1. What is Fake ATC?

Fake ATC is a voice simulation feature that plays scripted radio communication dialogues between the pilot (PM) and simulated ATC controllers. It uses the Web Speech API and the flight data entered in the Flight Briefing notepad to generate dynamic, realistic-sounding radio exchanges.

It is primarily an **audio feature** — the dialogue text is visible in the checklist as a reference, but its main purpose is to be spoken aloud by the voice engine.

---

## 2. Enabling the Feature

Fake ATC is toggled via the **Settings panel** (gear icon in the top bar) using the **Fake ATC** toggle switch.

- The setting is persisted in `localStorage` under the key `b738_fake_atc_enabled`.
- When enabled for the first time, an info popup appears explaining what the feature requires (origin/destination in the briefing notepad). This popup can be permanently dismissed with "Do not show again", which is stored separately under `b738_fake_atc_popup_seen` — independently from the equivalent briefing popup setting.
- When disabled, all `fake_atc` type items are hidden from the checklist as if they don't exist.

---

## 3. Data Sources

The Fake ATC system loads three JSON files at startup (via `loadAtcData()` in `script.js`):

| File | Location | Purpose |
|---|---|---|
| `airports_atc.json` | `public/data/atc/` | Airport ATC frequencies and callsigns |
| `firs_atc.json` | `public/data/atc/` | FIR (Flight Information Region) fallback frequencies |
| `greetings_atc.json` | `public/data/atc/` | Country/continent greeting and farewell phrases |

All three files are fetched client-side at runtime with `Promise.all()`. If any fetch fails, the ATC variable system will be empty and fake ATC items that require variables will simply not render.

---

## 4. Airport Data Format (`airports_atc.json`)

Each entry is keyed by ICAO code:

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

**Fields:**
- `type` — ATC position type: `DEL` (Delivery), `GND` (Ground), `TWR` (Tower), `APP` (Approach/Departure)
- `role` — Optional refinement for `APP` positions: `DEP` (departure) or `ARR` (arrival). Used to select the correct frequency when an airport has separate departure and arrival approach controllers.
- `callsign` — The spoken callsign (ASCII only, no diacritics — required for TTS compatibility)
- `frequency` — MHz frequency as a string
- `country` — ISO 3166-1 alpha-2 code, used for greeting lookup and radar/center naming rules
- `continent` — Two-letter continent code (`EU`, `NA`, `AS`, `AF`, `SA`, `OC`, `AN`)
- `fir` — ICAO FIR code, used as fallback when local frequencies are insufficient

---

## 5. FIR Data Format (`firs_atc.json`)

```json
"LKAA": { "name": "Praha", "callsign": "Praha Radar", "frequency": "120.900" }
```

Each FIR entry provides a single callsign and frequency used as the ultimate fallback for any airport that lacks local frequency coverage.

**Special rule:** For airports in `US`, `CA`, or `AU`, the word "Radar" or "Control" in a FIR callsign is automatically replaced with "Center" at runtime.

---

## 6. Greetings Data Format (`greetings_atc.json`)

```json
{
  "countries": {
    "SK": { "hello": "Dobry den", "bye": "Dovidenia" },
    "DE": { "hello": "Guten Tag", "bye": "Auf Wiedersehen" }
  },
  "continents": {
    "EU": { "hello": "Good day", "bye": "Goodbye" },
    "NA": { "hello": "Hello",    "bye": "Goodbye" }
  }
}
```

Greetings are stored without diacritics so that TTS engines pronounce them with a natural foreign accent rather than mispronouncing Unicode characters.

---

## 7. ATC Variable Resolution (`updateAtcVariables()`)

When the origin or destination ICAO field changes in the Flight Briefing notepad, `updateAtcVariables()` is called. It processes both the departure and arrival airport and populates the `atcVariables` object.

### 7.1 Frequency Fallback Chain

The system always tries to resolve each ATC role from the best available source, falling back through the hierarchy if a position is missing:

**Departure side** (`_dep` variables):

| Variable | Primary source | Fallback chain |
|---|---|---|
| `delivery_dep` | DEL | → GND → TWR → APP → FIR |
| `ground_dep` | GND | → TWR → APP → FIR |
| `tower_dep` | TWR | → APP → FIR |
| `approach_dep` | APP (role: DEP) or APP | → FIR |
| `fir_dep` | FIR entry for `apt.fir` | — |

**Arrival side** (`_arr` variables):

| Variable | Primary source | Fallback chain |
|---|---|---|
| `approach_arr` | APP (role: ARR) or APP | → TWR → FIR |
| `tower_arr` | TWR | → APP → FIR |
| `ground_arr` | GND | → TWR → FIR |
| `fir_arr` | FIR entry for `apt.fir` | — |

If FIR data is available, it additionally fills any departure-side variables that remain empty after the local airport frequency lookup.

Each variable also gets a corresponding `_freq` variant:
- `ground_dep` → callsign (e.g. `"Stefanik Ground"`)
- `ground_dep_freq` → frequency (e.g. `"121.705"`)

### 7.2 Regional Naming Rules

- **CZ, SK, DE, AT, HU** — The word "Approach" in an APP callsign is automatically replaced with "Radar" (e.g. `"Praha Approach"` → `"Praha Radar"`).
- **US, CA, AU** — The word "Radar" or "Control" in a FIR callsign is automatically replaced with "Center".

### 7.3 Unknown Airport Fallback (Pseudo-FIR)

If the entered ICAO code is not found in `airports_atc.json`, the system creates a minimal skeleton airport object. It attempts to determine the FIR from the first two letters of the ICAO code using a built-in prefix-to-FIR mapping (`PSEUDO_FIR`):

```js
'LZ' → 'LZBB'  // Slovakia → Bratislava
'ED' → 'EDGG'  // Germany → Langen
'EG' → 'EGTT'  // UK → London
'KJ' → 'KZNY'  // USA East → New York
// ...
```

This ensures that even airports not in the local dataset will at least resolve FIR-level frequencies.

### 7.4 Greeting Variables

For each airport (departure and arrival), the system resolves greeting/farewell phrases:

1. Looks up `greetings_atc.countries[airport.country]`
2. If not found, falls back to `greetings_atc.continents[airport.continent]`
3. If neither exists, defaults to `hello = "Hello"` / `bye = "Goodbye"`

This produces the following variables:

| Variable | Example value |
|---|---|
| `hello_dep` | `"Dobry den"` (for SK airports) |
| `bye_dep` | `"Dovidenia"` |
| `hello_arr` | `"Good day"` (for EU fallback) |
| `bye_arr` | `"Goodbye"` |

### 7.5 City Variables

| Variable | Source |
|---|---|
| `city_dep` | `apt.city` or `apt.name` or ICAO code |
| `city_arr` | same, for destination |

---

## 8. Complete Variable Reference

All variables available in `fake_atc` item text:

### Departure
| Variable | Description |
|---|---|
| `%delivery_dep%` | Clearance/Delivery callsign |
| `%delivery_dep_freq%` | Clearance/Delivery frequency |
| `%ground_dep%` | Ground callsign |
| `%ground_dep_freq%` | Ground frequency |
| `%tower_dep%` | Tower callsign |
| `%tower_dep_freq%` | Tower frequency |
| `%approach_dep%` | Departure/Approach callsign |
| `%approach_dep_freq%` | Departure/Approach frequency |
| `%fir_dep%` | FIR/Center callsign (departure) |
| `%fir_dep_freq%` | FIR/Center frequency (departure) |
| `%city_dep%` | Departure city name |
| `%hello_dep%` | Local greeting at departure airport |
| `%bye_dep%` | Local farewell at departure airport |

### Arrival
| Variable | Description |
|---|---|
| `%fir_arr%` | FIR/Center callsign (arrival) |
| `%fir_arr_freq%` | FIR/Center frequency (arrival) |
| `%approach_arr%` | Approach callsign |
| `%approach_arr_freq%` | Approach frequency |
| `%tower_arr%` | Tower callsign |
| `%tower_arr_freq%` | Tower frequency |
| `%ground_arr%` | Ground callsign |
| `%ground_arr_freq%` | Ground frequency |
| `%city_arr%` | Arrival city name |
| `%hello_arr%` | Local greeting at arrival airport |
| `%bye_arr%` | Local farewell at arrival airport |

### Briefing variables (also available in fake_atc items)
All standard Flight Briefing variables can also be used in `fake_atc` items, including `%callsign%`, `%dep_rwy%`, `%squawk%`, `%sid%`, `%initial_alt%`, `%dep_atis%`, `%dep_gate%`, etc.

---

## 9. Item Visibility Rules

A `fake_atc` item is **visible** only if:
1. The Fake ATC toggle is enabled (`isFakeAtcEnabled === true`)
2. `getFakeAtcValidSentences()` returns at least one sentence with all its variables resolved

If any sentence in the item's `text` array contains a variable that is not filled (either a briefing field is empty or an ATC variable could not be resolved), **that entire sentence is silently dropped**. If this causes all sentences to be dropped, the item is hidden entirely.

---

## 10. Voice Rendering

### Role Tags

Each sentence in a `fake_atc` item is prefixed with a role tag that determines which voice reads it:

| Tag | Speaker | Voice |
|---|---|---|
| `#pm` | Pilot Monitoring (you) | Selected pilot voice (male or female per setting) |
| `#atc` | ATC controller | Opposite gender from the pilot voice |

The tags themselves are **never spoken** — they are stripped before the text is passed to the TTS engine.

If no tag is present, the sentence defaults to the `pm` role.

### The Pause Tag

The `#pause` tag can be used on its own line to insert a natural delay (approx. 2 seconds) between dialogue exchanges. This is typically used to simulate the time it takes to change frequencies during a handover. 
When the UI renders the dialogue block, the `#pause` tag is hidden and replaced with a blank line (paragraph break) for visual clarity.

### Voice Gender Logic

```
User setting: Male Voice = ON
  → #pm sentences: male voice
  → #atc sentences: female voice

User setting: Male Voice = OFF
  → #pm sentences: female voice
  → #atc sentences: male voice
```

This ensures ATC always sounds like a different person from the pilot.

### Pause Character `|`

A `|` character in a sentence inserts a 500 ms silence pause at that point in the audio. This allows adding natural cadence to longer radio calls.

Example: `"#atc Cleared to %city_arr% | via %sid% | runway %dep_rwy%."` — each phrase is separated by a half-second pause.

### Playback Flow

1. User clicks the play icon on a `fake_atc` item (or the voice engine reaches it automatically).
2. The item is marked as "currently playing" (`currentPlayingBriefingIndex`).
3. The item renders with a stop icon and visual "checked" styling while playing.
4. All sentences are queued and played sequentially via `playNextUtterance()`.
5. When all sentences finish, `simulateCheckAction()` is called — the item is marked as checked and the engine advances to the next item.
6. Clicking the item again while it's playing cancels playback and unchecks it.

### Interaction with Read CL Only Mode

In **Read CL Only** mode, `fake_atc` items behave like `briefing` items — the voice engine pauses before them and waits for the user to manually trigger playback. They are not auto-read in sequence with checklist items.

---

## 11. Authoring `fake_atc` Items in a Dataset

### Item Structure

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

**Rules:**
- `type` must be exactly `"fake_atc"`
- `text` is an array of strings — each string is one sentence
- Each sentence is either shown and spoken, or silently dropped if its variables aren't filled
- Sentences with no variables are always shown and always spoken
- Use `#atc` or `#pm` prefix to assign the speaker role
- Use `|` to insert pauses within a sentence
- Sentences do **not** need a `name` or `action` field — `fake_atc` items have no challenge/response structure

### Variable Availability Requirement

A sentence is only included if **all** variables within it are resolved. This means:
- If `%dep_gate%` is empty in the briefing, any sentence containing `%dep_gate%` will be silently skipped.
- This allows graceful degradation — incomplete flight data just removes those specific calls from the dialogue, without breaking anything.

---

## 12. Display in the Checklist UI

`fake_atc` items render differently from standard checklist items:
- No `name . . . action` layout
- The full sentence text is displayed as a block
- `#atc` sentences are wrapped in `<span class="atc-voice-text">` and displayed in a distinct accent color
- `#pm` sentences are displayed in the standard text color
- A play/stop icon appears on the right (same as briefing items)
- While playing, the item appears visually "checked" (strikethrough styling is suppressed during active ATC playback)
- A section separator labeled **"ATC"** appears above the first `fake_atc` item on a page

---

*Last updated: 2026-05-09*
