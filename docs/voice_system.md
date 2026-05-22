# Voice System — Engine & UI

This document describes the technical implementation of the voice control system in Charlie-Lima, including speech recognition logic, synthesis processing, and the visual feedback system.

---

## 1. Core Architecture

The voice system is built on the **Web Speech API**, consisting of two main parts:
- **Speech Recognition:** Converts user voice commands into application actions.
- **Speech Synthesis (TTS):** Reads checklist items, briefings, and ATC dialogue.

The engine is managed by several global state variables in `script.js`:

| Variable | Type | Purpose |
|---|---|---|
| `isListening` | Boolean | Whether the microphone is currently active |
| `hasStartedReading` | Boolean | Whether a checklist phase is currently being read |
| `isSpeaking` | Boolean | Echo protection flag — true while the system is outputting audio |
| `readCLOnlyChecklistPhaseActive` | Boolean | Whether a checklist phase was manually triggered in Read CL Only mode |
| `isTimerActivePause` | Boolean | Whether the voice engine is paused waiting for a timer to finish |
| `currentPlayingBriefingIndex` | Number | Index of the briefing/ATC item currently being read (-1 = none) |
| `window.currentSpeechSession` | Number | Monotonic counter used to invalidate orphaned speech queues |
| `window.manualBriefingPlay` | Boolean | Flag for manual briefing/ATC playback (prevents auto-advance) |

---

## 2. Speech Recognition (The Voice Model)

Instead of traditional strict keyword matching, Charlie-Lima uses a **Robust Counter Strategy** to handle the inherent inaccuracies of web-based speech recognition.

### 2.1 Activation (The Trigger)
To begin reading a checklist, the user must say a phrase containing the word **"Checklist"** (or the common misinterpretation **"Craigslist"**).
- Once triggered, `hasStartedReading` becomes `true` and the engine begins sequential playback.
- The engine immediately counts all existing action words in the transcript at activation time and stores that count — this prevents false triggers from words already spoken before activation.

### 2.2 Manual & UI Triggers
Beyond voice activation, the engine can be controlled via:
- **Global Right Click:** Performs a "Check" action on the next item. If the engine is currently speaking, it instantly stops all speech (`speechSynthesis.cancel()`). In Read CL Only mode, right-clicking on flow/briefing/ATC items simply checks them off without starting the voice engine.
- **Checklist Title Click:** Clicking the header of a checklist phase (e.g., "BEFORE START") while in Voice Mode manually starts the reading process for that phase.
- **Item Click (Briefing/ATC):** Clicking a briefing or fake_atc item while in voice mode triggers manual playback of that specific item. The item is unchecked, played, and automatically re-checked on completion.

### 2.3 Command Recognition
The system monitors the transcript for **Action Words**:

| Word Category | Keywords |
|---|---|
| **Action (Check)** | `check`, `set`, `call`, `reset`, `start`, `steady`, `announcement`, `revoke`, `continuous`, `retract`, `auto`, `open`, `down`, `green`, `on`, `off`, `up`, `arm`, `completed` |
| **Repeat** | `repeat`, `again` |

- **Logic:** The engine counts how many action words appear in the cumulative transcript. If the count increases, the system performs a `toggleCheck()` on the next item and proceeds.
- **Repeat:** Saying `"Repeat"` or `"Again"` triggers `speakCurrentItem()` without checking it off.

### 2.4 Robustness Features
- **Echo Protection:** While the application is speaking (`isSpeaking === true`), the recognition engine ignores all incoming transcripts to prevent the system from "hearing" itself. During speech output, the microphone is physically disconnected (`recognition.abort()`) and reconnected only after the utterance ends.
- **Debounce Protection:** An 800ms cooldown is applied after every recognized command to prevent accidental double-checking from long sentences containing multiple action words.
- **Stutter Filter Reset:** After every successful command, the recognition is physically stopped (`recognition.stop()`) to clear Chrome's internal stutter filter, which can suppress repeated identical words.
- **Transcript Reset Detection:** If the transcript length suddenly decreases by 20+ characters (Chrome memory reset), all processed counters are reset to zero to prevent desynchronization.
- **Delayed Check Animation:** The visual check-off is delayed by 700ms after voice recognition to feel natural and not robotic.

---

## 3. Speech Synthesis (The Engine)

The synthesis engine processes text through a custom formatter (`spellAbbreviations()`) before sending it to the TTS hardware.

### 3.1 Phonetic & Abbreviation Processing

The `spellAbbreviations()` function applies the following transformations in order:

#### Phase 1: Special Phrase Replacements
Before any phonetic processing, these exact-match replacements are applied:

| Pattern | Replacement |
|---|---|
| `COMMAND A` / `COMMAND B` | "command ey" / "command bee" |
| `L SIDE` / `R SIDE` | "left side" / "right side" |
| `L & R` | "left and right" |
| `G/S` | "glide slope" |
| `P-inhibit` | "p inhibit" |
| `{number}l` | "{number} liters" |
| `{number}°c` | "{number} celsius" |
| `IGN R` | "ignition right" |
| `WXR` | "weather" |
| `INIT ALT` | "initial altitude" |
| `100%` | "one hundred percent" |
| `GRD` | "ground" |
| `DEP/ARR` | "departure approach" |
| `P6` / `P18` | "p 6" / "p 18" |

#### Phase 2: Decimal Pronunciation
Numbers with decimal points are read with the word "decimal":
- `118.1` → "118 decimal 1"
- `121.5` → "121 decimal 5"

#### Phase 3: NATO Alphabet & Character Spelling
- **Single letters** (A–Z, case-insensitive) are converted to NATO phonetic alphabet (e.g., `A` or `a` → "Alpha", `C` or `c` → "Charlie"). This handles standalone notations like taxiways.
- **Known acronyms** (`CLASSIC_SPELL_EXCEPTIONS`: ~50+ terms like `IRS`, `FMC`, `GPWS`, `ADI`, `ISFD`, etc.) are read **character-by-character** without NATO conversion (e.g., `IRS` → "I R S")
- **All-uppercase words** (2+ characters) that aren't in the exception or exclusion list are NATO-spelled (e.g., `ILS` → "India Lima Sierra")
- **Excluded words** (`DONT_SPELL`: ~80+ terms like `CHECK`, `SET`, `TAXI`, `APPROACH`, etc., **plus all airline callsigns dynamically loaded from the database**) are read naturally without any spelling

#### Phase 4: Number Formatting
- Numbers with 2+ digits are read **digit-by-digit** (e.g., `148` → "1 4 8")
- `0` is always read as "zero"
- `9` is always read as "niner" (aviation standard)

#### Phase 5: Chapter Title Exception
When reading chapter/page titles, the `skipSpelling` flag is set to `true`, which bypasses NATO/character spelling entirely but still applies digit-by-digit number reading. This prevents titles like "BEFORE START" from being spelled as "Bravo Echo Foxtrot..."

### 3.2 Role-Based Voices
The engine supports multiple speakers within a single item using role tags:
- **`#pm` (Pilot Monitoring):** Uses the user-selected voice gender.
- **`#atc` (ATC Controller):** Automatically switches to the **opposite gender** voice for realistic differentiation.

### 3.3 Voice Selection Algorithm

The `getSelectedVoice(overrideRole)` function selects TTS voices using this priority:

1. **Check cache:** `cachedVoiceMale` / `cachedVoiceFemale` (reset when voice setting changes or `onvoiceschanged` fires)
2. **Filter to English voices** (`en-*` locale). If none found, use all available voices.
3. **Search by preferred name list:**
   - **Female:** `samantha`, `google us english`, `zira`, `karen`, `moira`, `tessa`, `female`, `sfg`, `fis`
   - **Male:** `google uk english male`, `daniel`, `en-gb-x-gbd`, `en-gb-x-gbm`, `david`, `mark`, `alex`, `male`, `rjs`, `iom`, `tpd`, `lee`
4. **Regional fallback:** Male → `en-GB` → `en-AU`; Female → `en-US`
5. **Last resort:** Pick the last voice in the list (male) or the first voice (female)

### 3.4 Speech Rate
- **Male voice:** Rate = `1.28` (slightly faster for authoritative feel)
- **Female voice:** Rate = `1.09` (natural pace)

### 3.5 Airline Telephony
The engine includes a mapping of ~50 ICAO airline codes to their telephony callsigns:
- **Mapping:** `RYR` → "Ryanair", `DLH` → "Lufthansa", `BAW` → "Speedbird", `TVQ` → "Smartwings", etc.
- **Suffixes:** Alphanumeric suffixes (e.g., `RYR123`) are concatenated correctly (e.g., "Ryanair 123").
- **Runway Formatting:** `04L` → "zero four Left", `22R` → "two two Right", `09C` → "zero nine Center"
- **ATIS Letter:** Single-letter ATIS codes are NATO-spelled (e.g., `A` → "Alpha")
- **Flight Level:** 3-digit cruise altitudes are prefixed with "Flight Level" (e.g., `350` → "flight level 350")

---

## 4. Playback Flow (Step-by-Step)

### 4.1 Standard Checklist Reading

```
1. User says "Checklist" or right-clicks while mic is on
       ↓
2. prepareChecklistReading()
   ├── Speaks "[Page Title] Checklist." (with skipSpelling)
   └── Calls speakCurrentItem()
       ↓
3. speakCurrentItem()
   ├── Finds first unchecked visible item
   ├── Auto-scrolls to that item
   ├── Builds utterance queue (name + action for regular items)
   ├── Disables microphone (recognition.abort())
   ├── Plays all utterances via playNextUtterance()
   └── On end → re-enables microphone, waits for voice command
       ↓
4. User says an action word (e.g., "check", "set")
       ↓
5. simulateCheckAction()
   ├── Checks the current item (with click sound + haptic vibration)
   ├── Waits 1120ms
   └── Calls speakCurrentItem() again → loop to step 3
       ↓
6. All items checked → announces "[Title] Checklist completed."
   ├── Auto-navigates to next page after 560ms
   └── Waits for new "Checklist" trigger on next page
```

### 4.2 Briefing / Fake ATC Playback

```
1. Voice engine reaches a briefing/fake_atc item (or user clicks it)
       ↓
2. currentPlayingBriefingIndex is set → re-render shows stop icon
       ↓
3. For fake_atc: each sentence is queued with its role (#pm/#atc)
   ├── #pause tags insert 2000ms delays
   ├── Pipe characters (|) insert 500ms pauses within a sentence
   └── Each sentence gets the correct voice (male/female per role)
       ↓
4. All sentences finish → simulateCheckAction() checks the item
       ↓
5. Continue to next item
```

### 4.3 Read CL Only Mode

In **Read CL Only** mode, the engine operates in a hybrid fashion:
- **Flow, briefing, and ATC items** are **not auto-read**. The voice engine pauses and waits for the user to manually interact with them (click or right-click).
- **Checklist items** require the "Checklist" voice command to start reading.
- When the last checklist item in a phase is checked, the engine announces "[Title] Checklist completed." and pauses again.
- The engine auto-navigates to the next page but does NOT auto-start reading.
- Right-clicking on flow/ATC items in this mode simply checks them off silently.

---

## 5. Mid-Page Transition Announcements

When the voice engine transitions between different item types on the same page, it inserts contextual announcements:

| Previous Item | Next Item | Announcement |
|---|---|---|
| `flow` | `checklist item` | "[Page Title] Checklist." |
| `checklist item` | `flow` / `briefing` / `fake_atc` | "[Page Title] Checklist complete." |

These transitions only occur in **standard mode** (not Read CL Only).

---

## 6. Page Completion Logic

When all items on a page are checked, the engine speaks a completion phrase:

| Last Visible Item Type | Phrase |
|---|---|
| `checklist item` | "[Page Title] Checklist completed." |
| `flow` | "[Page Title] flow complete." |
| `fake_atc` | *(no announcement — silently advances)* |
| *(last page of checklist)* | "...And we can go home." |

---

## 7. The Voice Bar (UI)

The **Voice Bar** is a floating UI component that provides real-time feedback on the state of the voice engine.

### 7.1 Visual Indicators
- **Hidden/Visible:** The bar only appears when the microphone is active (`isListening`) on viewports >700px.
- **Equalizer Animation:** A 5-bar CSS-animated equalizer that pulses during activity.
- **Voice Dot:** A small red dot indicating active microphone state.
- **Status Colors:**
  - **Green (Success):** The equalizer and mic button flash green for 1500ms when a command is successfully recognized.
  - **Red (Error):** The equalizer turns red if a recognition error occurs (e.g., network timeout or "not-allowed" permission).

### 7.2 Mobile Behavior (351–700px)
On mobile devices, the voice bar is **hidden entirely** (`display: none`). Instead:
- The **mic FAB button** itself pulses with a red glow animation (`mic-pulse-mobile`) when active
- Green flash feedback appears directly on the mic button

### 7.3 Ultra-Small Screens (≤350px) — "Cockpit Mode"
On screens ≤350px wide (e.g., small smartwatches or cockpit-mounted devices):
- **All UI except the voice bar is hidden** (top bar, FABs, footer, app container)
- The voice bar expands to fill the **entire screen** (100vw × 100vh)
- The inner content renders as a **large circle** (90vmin, max 260px) with the equalizer and stop button centered
- The action timer also fills the entire screen in this mode

### 7.4 Interaction Buttons
- **Mic Button (FAB):** Toggle in the floating button group. Activates/deactivates the entire voice system.
- **Stop Button (Voice Bar):** Located directly on the Voice Bar to instantly stop reading, cancel speech, and release the microphone.
- **Auto-Scrolling:** When the voice engine moves to a new item, the UI automatically scrolls that item into the center of the viewport (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).

### 7.5 FAB Group Position Shift
On tablet viewports (701–1450px), when the voice bar is active, the FAB group slides left by 133px (`translateX(-133px)`) with a spring animation to avoid overlapping the voice bar.

---

## 8. Screen Wake Lock

When the microphone is activated, the engine requests a **Screen Wake Lock** via the `navigator.wakeLock` API:
- **Request:** `navigator.wakeLock.request('screen')` — prevents the device from dimming/sleeping while voice mode is active.
- **Release:** The lock is released when the user deactivates the microphone.
- **Graceful Degradation:** If the Wake Lock API is not available (older browsers), the feature is silently skipped.

---

## 9. Voice System Error Handling

| Error | Behavior |
|---|---|
| `aborted` | Silently ignored (this is intentionally triggered by `recognition.abort()`) |
| `no-speech` | Silently ignored |
| `not-allowed` | Microphone permission denied — sets `isListening = false`, shows red equalizer |
| Any other | Shows red error state on equalizer, logs to console |

When `recognition.onend` fires while `isListening` is still true, the engine automatically restarts recognition after 100ms (unless currently speaking).

---

*Last updated: 2026-05-10*
