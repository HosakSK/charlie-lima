# User Settings & Display Features

This document describes the various user-adjustable settings and display modes available in Charlie-Lima, including their technical implementation and persistence.

---

## 1. Visual & Accessibility Settings

### 1.1 Day/Night Mode (Theme)
- **Description:** Toggles between a high-contrast light theme and a dark mode optimized for night flying.
- **Implementation:** Sets the `data-theme="dark"` attribute on the `<html>` element. CSS variables in `globals.css` and `styles.css` respond to this attribute.
- **Persistence:** `localStorage` key `b738_theme` (`"dark"` or `"light"`).

### 1.2 Monospace Font
- **Description:** Switches the application font from the modern **Inter** typeface to **IBM Plex Mono**, providing a "retro" or "computerized" cockpit feel.
- **Implementation:** Dynamically updates `document.body.style.fontFamily`.
- **Persistence:** `localStorage` key `b738_mono` (`"true"` or `"false"`).

---

## 2. Audio & Voice Settings

### 2.1 Mute Toggle
- **Description:** Instantly silences all application sounds.
- **Implementation:** 
  - Calls `window.speechSynthesis.cancel()` to stop active speech.
  - Sets the `muted` property on the `audioClick` element (checkbox sound).
- **Persistence:** `localStorage` key `b738_muted` (`"true"` or `"false"`).

### 2.2 Voice Gender (Male/Female)
- **Description:** Selects the preferred voice for the pilot (PM).
- **Implementation:** 
  - Filters available system voices based on a priority list (e.g., "Google UK English Male" vs "Samantha").
  - **Fake ATC Interaction:** If enabled, the ATC controller voice automatically uses the **opposite gender** of the selected pilot voice.
- **Persistence:** `localStorage` key `b738_male_voice` (`"true"` or `"false"`).

---

## 3. Checklist Filtering & Logic

### 3.1 Hide Flow (Checklist Only)
- **Description:** Filters the checklist to show only formal challenge-response items, hiding all "Cockpit Flow" procedural steps.
- **Implementation:** 
  - `isItemVisible()` returns `false` for items with `type: "flow"`.
  - When enabled, the engine automatically skips pages that contain only flow items.
- **Persistence:** None (resets to `false` on page reload).

### 3.2 Read CL Only
- **Description:** A hybrid voice mode where all items are visible, but the voice assistant **ignores flows, briefings, and ATC blocks**.
- **Implementation:** 
  - The voice engine pauses before these items and waits for the user to manually trigger them or perform the flow.
  - Formal reading only resumes when the user gives the "Checklist" voice command.
- **Persistence:** `localStorage` key `b738_read_cl_only` (`"true"` or `"false"`).

### 3.3 Simplify Mode
- **Description:** Removes non-essential or repetitive items from the checklist for a faster, "shortened" turnaround experience.
- **Implementation:** `isItemVisible()` returns `false` for items with `subtype: "simplify"`.
- **Persistence:** `localStorage` key `b738_simplify` (`"true"` or `"false"`).

### 3.4 Hide Tests
- **Description:** Hides system test items (e.g., Fire Test, GPWS Test) and items with actions starting with "Test" or "Verify".
- **Implementation:** 
  - Filters by `subtype: "test"`.
  - Also performs a string match on the `action` field for "test" or "verify".
- **Persistence:** `localStorage` key `b738_hide_tests` (`"true"` or `"false"`).

---

## 4. Feature-Specific Toggles

### 4.1 Show Briefing
- **Description:** Enables the rendering of dynamic text blocks generated from the Flight Briefing notepad.
- **Implementation:** 
  - Toggles visibility of `type: "briefing"` items.
  - Displays a one-time info popup when first enabled.
- **Persistence:** `localStorage` key `b738_briefing_enabled` (`"true"` or `"false"`).

### 4.2 Disable Timer
- **Description:** Prevents the circular countdown timer from appearing when timed items (e.g., APU Start) are checked.
- **Implementation:** Bypasses the `startActionTimer()` call in the `toggleCheck()` logic.
- **Persistence:** `localStorage` key `b738_disable_timer` (`"true"` or `"false"`).

---

## 5. Technical Persistence Summary

| Setting | Storage Key | Default |
|---|---|---|
| Theme | `b738_theme` | `light` |
| Monospace Font | `b738_mono` | `false` |
| Mute | `b738_muted` | `false` |
| Voice Gender | `b738_male_voice` | `false` (Female) |
| Read CL Only | `b738_read_cl_only` | `false` |
| Simplify Mode | `b738_simplify` | `false` |
| Hide Tests | `b738_hide_tests` | `false` |
| Briefing Enabled | `b738_briefing_enabled` | `false` |
| Disable Timer | `b738_disable_timer` | `false` |

---

*Last updated: 2026-05-10*
