# Voice System — Engine & UI

This document describes the technical implementation of the voice control system in Charlie-Lima, including speech recognition logic, synthesis processing, and the visual feedback system.

---

## 1. Core Architecture

The voice system is built on the **Web Speech API**, consisting of two main parts:
- **Speech Recognition:** Converts user voice commands into application actions.
- **Speech Synthesis (TTS):** Reads checklist items, briefings, and ATC dialogue.

The engine is managed by several global state variables in `script.js`:
- `isListening`: Boolean indicating if the microphone is active.
- `hasStartedReading`: Boolean indicating if a checklist phase is currently being processed.
- `isSpeaking`: Boolean used for echo protection while the system is talking.

---

## 2. Speech Recognition (The Voice Model)

Instead of traditional strict keyword matching, Charlie-Lima uses a **Robust Counter Strategy** to handle the inherent inaccuracies of web-based speech recognition.

### 2.1 Activation (The Trigger)
To begin reading a checklist, the user must say a phrase containing the word **"Checklist"** (or the common misinterpretation **"Craigslist"**). 
- Once triggered, `hasStartedReading` becomes `true` and the engine begins sequential playback.

### 2.2 Command Recognition
The system monitors the transcript for **Action Words**:
- **Keywords:** `check`, `set`, `call`, `reset`, `start`, `steady`, `auto`, `open`, `down`, `green`, `on`, `off`, `up`, `arm`, `completed`.
- **Logic:** The engine counts how many action words appear in the cumulative transcript. If the count increases, the system performs a `toggleCheck()` on the next item and proceeds.
- **Repeat:** Saying `"Repeat"` or `"Again"` triggers `speakCurrentItem()` without checking it off.

### 2.3 Robustness Features
- **Echo Protection:** While the application is speaking (`isSpeaking === true`), the recognition engine ignores all incoming transcripts to prevent the system from "hearing" itself.
- **Debounce Ochrana:** A 800ms cooldown is applied after every recognized command to prevent accidental double-checking from long sentences.
- **Abortion Cycle:** To clear the internal "stutter filter" of some browsers (like Chrome), the recognition is physically stopped and restarted (`abort()` -> `start()`) after every successful command.

---

## 3. Speech Synthesis (The Engine)

The synthesis engine processes text through a custom formatter (`spellAbbreviations`) before sending it to the TTS hardware.

### 3.1 Phonetic & Abbreviation Processing
- **NATO Alphabet:** Single letters and known acronyms (e.g., `IRS`, `FMC`) are automatically converted to NATO phonetic spelling or character-by-character readout (e.g., `IRS` → "India Romeo Sierra").
- **Exceptions:** Common aviation terms like `V1`, `V2`, `QNH`, `APU` are read character-by-character without phonetic conversion.
- **Numerical Formatting:** 
  - **Decimals:** Frequencies (e.g., `118.1`) are read with the word **"decimal"**.
  - **Digits:** Numbers with 2+ digits (altitudes, squawk codes) are read digit-by-digit (e.g., `100` → "one zero zero").
  - **Flight Levels:** 3-digit altitudes are prefixed with "Flight Level".

### 3.2 Role-Based Voices
The engine supports multiple speakers within a single item using role tags:
- **`#pm` (Pilot):** Uses the user-selected voice gender.
- **`#atc` (Controller):** Automatically switches to the **opposite gender** voice for realistic differentiation.

---

## 4. The Voice Bar (UI)

The **Voice Bar** is a floating UI component that provides real-time feedback on the state of the voice engine.

### 4.1 Visual Indicators
- **Hidden/Visible:** The bar only appears when the microphone is active (`isListening`).
- **Equalizer Animation:** A CSS-animated bar that pulses during activity.
- **Status Colors:**
  - **Green (Success):** Flashes when a command is successfully recognized.
  - **Red (Error):** Appears if a recognition error occurs (e.g., network timeout or "not-allowed" permission).

### 4.2 Interaction Logic
- **Mic Button:** Toggle in the bottom-right corner.
- **Stop Button:** Located directly on the Voice Bar to instantly stop reading and release the microphone.
- **Auto-Scrolling:** When the voice engine moves to a new item, the UI automatically scrolls that item into the center of the viewport for better visibility.

---

## 5. Regional Features

- **Language Support:** While the commands are English-based, localized greetings (`greetings_atc.json`) are rendered without diacritics to ensure clean pronunciation by various international TTS engines.

---

*Last updated: 2026-05-10*
