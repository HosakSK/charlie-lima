# User Settings & Display Features

This document describes the various user-adjustable settings and display modes available in Charlie-Lima, including their technical implementation and persistence.

---

## 1. Visual & Accessibility Settings

### 1.1 Day/Night Mode (Theme)

| Property | Value |
|---|---|
| **Toggle Label** | "Day/Night" |
| **Persistence** | `b738_theme` (`"dark"` \| `"light"`) |
| **Default** | `light` |

- **Implementation:** Sets the `data-theme="dark"` attribute on the `<html>` element. CSS variables in `globals.css` respond to this attribute.
- **Color Palette:**

| Variable | Light Mode | Dark Mode |
|---|---|---|
| `--color-background` | `#F5F7F7` | `#242627` |
| `--color-text` | `#242627` | `#dbe1e2` |
| `--color-accent` | `#00BDB1` (teal) | `#FF8C00` (orange) |
| `--color-body-bg` | `#F5F7F7` | `#4f5354` |
| `--color-line` | `#00BDB1` | `#4f5354` |

- **Browser Integration:** Dynamically updates the HTML `meta[name="theme-color"]` tag to ensure the browser's address bar/UI matches the application's theme (`#F5F7F7` for light, `#242627` for dark).

### 1.2 Monospace Font

| Property | Value |
|---|---|
| **Toggle Label** | "Mono Font" |
| **Persistence** | `b738_mono` (`"true"` \| `"false"`) |
| **Default** | `false` (Inter) |

- **Implementation:** Dynamically updates `document.body.style.fontFamily`.
- **Fonts:** Switches between **Inter** (modern sans-serif) and **IBM Plex Mono** (monospace), providing a "retro" or "computerized" cockpit feel.

---

## 2. Audio & Voice Settings

### 2.1 Mute Toggle

| Property | Value |
|---|---|
| **Toggle Label** | "Mute" |
| **Persistence** | `b738_muted` (`"true"` \| `"false"`) |
| **Default** | `false` |

- **Implementation:**
  - Calls `window.speechSynthesis.cancel()` to stop active speech.
  - Sets the `muted` property on the `audioClick` element (checkbox sound).
  - When muted, all TTS operations are bypassed — utterances are created but not spoken, and their `onend` callbacks fire immediately to maintain logic flow.

### 2.2 Voice Gender (Male/Female)

| Property | Value |
|---|---|
| **Toggle Label** | "Male Voice" |
| **Persistence** | `b738_male_voice` (`"true"` \| `"false"`) |
| **Default** | `false` (Female) |

- **Implementation:**
  - Fires a custom `b738_voice_changed` window event on change, which invalidates the cached voice objects.
  - Filters available system voices based on platform-specific priority lists (see [Voice System](voice_system.md) for full algorithm).
- **Speech Rates:** Male = 1.28×, Female = 1.09×.
- **Fake ATC Interaction:** When enabled, the ATC controller voice automatically uses the **opposite gender** of the selected pilot voice.

---

## 3. Checklist Filtering & Logic

### 3.1 Hide Flow (Checklist Only)

| Property | Value |
|---|---|
| **Toggle Label** | "Hide Flow" |
| **Persistence** | None (resets to `false` on page reload) |
| **Default** | `false` |
| **Visibility** | Only shown if the dataset contains `flow` items |

- **Implementation:**
  - `isItemVisible()` returns `false` for items with `type: "flow"`.
  - When enabled, the engine automatically skips pages that contain only flow items.
  - Quick Navigation is rebuilt to hide flow-only pages.
  - If the current page becomes empty after enabling, the engine finds the next valid page.

### 3.2 Read CL Only

| Property | Value |
|---|---|
| **Toggle Label** | "Read CL Only" |
| **Persistence** | `b738_read_cl_only` (`"true"` \| `"false"`) |
| **Default** | `false` |

- **Implementation:**
  - A hybrid voice mode where **all items are visible**, but the voice assistant **only reads formal checklist items**.
  - Flow, briefing, and ATC items are paused — the voice engine waits for the user to manually trigger them (click or right-click).
  - Reading only resumes when the user gives the "Checklist" voice command (which starts the next checklist phase).
  - For full behavioral details, see [Voice System](voice_system.md) §4.3.

### 3.3 Simplify Mode

| Property | Value |
|---|---|
| **Toggle Label** | "Simplify" |
| **Persistence** | `b738_simplify` (`"true"` \| `"false"`) |
| **Default** | `false` |
| **Visibility** | Only shown if the dataset contains items with `subtype: "simplify"` (or an array containing it) |

- **Implementation:** `isItemVisible()` returns `false` for items with `subtype: "simplify"` (or arrays containing `"simplify"`).

### 3.4 Hide Tests

| Property | Value |
|---|---|
| **Toggle Label** | "Hide Tests" |
| **Persistence** | `b738_hide_tests` (`"true"` \| `"false"`) |
| **Default** | `false` |
| **Visibility** | Only shown if the dataset contains test items (determined by `subtype: "test"` or `action` starting with "test/verify") |

- **Implementation:**
  - Filters by `subtype: "test"` (or arrays containing `"test"`).
  - Also performs a case-insensitive match on the `action` field — hides items where the action **equals or starts with** `"test"` or `"verify"`.

---

## 4. Feature-Specific Toggles

### 4.1 Show Briefing

| Property | Value |
|---|---|
| **Toggle Label** | "Show Briefing" |
| **Persistence** | `b738_briefing_enabled` (`"true"` \| `"false"`) |
| **Default** | `false` |

- **Implementation:**
  - Toggles visibility of `type: "briefing"` items via `isItemVisible()`.
  - Displays a **one-time info popup** when first enabled (dismissible with "Do not show again").
  - The popup state is stored separately: `b738_briefing_popup_seen`.
  - Enabling/disabling triggers `renderPage(false)` to immediately update the checklist.

### 4.2 Fake ATC

| Property | Value |
|---|---|
| **Toggle Label** | "Fake ATC" |
| **Persistence** | `b738_fake_atc_enabled` (`"true"` \| `"false"`) |
| **Default** | `false` |

- **Implementation:**
  - Toggles visibility of `type: "fake_atc"` items via `isItemVisible()`.
  - Displays a **one-time info popup** when first enabled (separate from the briefing popup).
  - The popup state is stored as `b738_fake_atc_popup_seen`.
  - For full details, see [Fake ATC](fake_atc.md).

### 4.3 Disable Timer

| Property | Value |
|---|---|
| **Toggle Label** | "Disable Timer" |
| **Persistence** | `b738_disable_timer` (`"true"` \| `"false"`) |
| **Default** | `false` |

- **Implementation:** Bypasses the `startActionTimer()` call in the `toggleCheck()` logic. Items with `timer` property are checked normally but no countdown overlay appears.

---

## 5. Dataset Selection (Profile)

| Property | Value |
|---|---|
| **Label** | "Profile" |
| **Persistence** | `b738_dataset` (file path string) |
| **Default** | First available dataset (typically `europe_style.js`) |

- **Implementation:** A custom dropdown in the settings panel that lists all available datasets discovered via `/api/datasets`.
- **Behavior:** Selecting a new dataset saves it to localStorage and **reloads the entire page** after 100ms delay.
- **Dynamic Population:** The dropdown options are generated from `window.availableDataSets`, which is populated by the page component's dataset fetch logic.

---

## 6. Technical Persistence Summary

| Setting | Storage Key | Default | Persists Across Reload |
|---|---|---|---|
| Theme | `b738_theme` | `light` | ✅ |
| Monospace Font | `b738_mono` | `false` | ✅ |
| Mute | `b738_muted` | `false` | ✅ |
| Voice Gender | `b738_male_voice` | `false` (Female) | ✅ |
| Read CL Only | `b738_read_cl_only` | `false` | ✅ |
| Simplify Mode | `b738_simplify` | `false` | ✅ |
| Hide Tests | `b738_hide_tests` | `false` | ✅ |
| Briefing Enabled | `b738_briefing_enabled` | `false` | ✅ |
| Fake ATC Enabled | `b738_fake_atc_enabled` | `false` | ✅ |
| Disable Timer | `b738_disable_timer` | `false` | ✅ |
| Dataset | `b738_dataset` | Auto-detected | ✅ |
| Briefing Data | `b738_briefing_v2` | `{}` | ✅ |
| Help Language | `b738_help_lang` | `en` | ✅ |
| Briefing Popup | `b738_briefing_popup_seen` | `false` | ✅ |
| ATC Popup | `b738_fake_atc_popup_seen` | `false` | ✅ |
| **Hide Flow** | *(none)* | `false` | ❌ Resets on reload |

---

## 7. Global Reset

| Property | Value |
|---|---|
| **Button** | "Reset Settings" (bottom of settings panel) |
| **Confirmation** | Yes — "Reset completely to defaults?" |

**Cleared keys:** `b738_theme`, `b738_mono`, `b738_disable_timer`, `b738_male_voice`, `b738_muted`, `b738_briefing_enabled`, `b738_briefing_popup_seen`, `b738_fake_atc_enabled`, `b738_fake_atc_popup_seen`, `b738_dataset`, `b738_read_cl_only`.

> **Note:** The briefing data (`b738_briefing_v2`) is **not** cleared by Reset Settings. Use the "Clear All" button inside the briefing notepad to clear flight data.

After clearing, the page is reloaded (`location.reload()`).

---

## 8. UI/UX Interactions

### 8.1 Draggable Overlays
Several UI components can be repositioned by the user:

| Component | Drag Handle | Touch Support |
|---|---|---|
| **Briefing Notepad** | Top panel header (`#overlay-drag-handle`) | ✅ |
| **Action Timer** | Entire timer overlay | ✅ |

- **Notepad:** Uses a coordinate tracking system (mousedown/touchstart captures offset, mousemove/touchmove updates position). On first drag, the panel transitions from CSS `transform: translate(-50%, -50%)` to absolute pixel positioning.
- **Timer:** Constrained to viewport bounds — the `keepTimerInBounds()` function fires on every `resize` event and prevents the timer from disappearing off-screen.

### 8.2 Notepad Positioning Logic
When the Briefing FAB button is clicked:
- **Desktop (>1450px):** The notepad is positioned to the left of the FAB group with a 20px gap
- **Tablet (701–1450px):** The notepad snaps to the right edge with 20px padding
- **Mobile (≤700px):** The notepad is centered (default CSS positioning)

### 8.3 Settings Panel
- The settings panel slides in from the right on desktop, or spans full width on mobile
- Clicking outside the panel automatically closes it
- Toggle labels have a dotted leader line connecting to the switch (CSS `::after` pseudo-element)

### 8.4 Quick Navigation
- The Quick Navigation dropdown lists all checklist pages with visible items
- Active page is highlighted
- Pages with no visible items (due to filters) are excluded
- Position is dynamically calculated relative to the hamburger button

### 8.5 Turnaround Mode
- The "TURNAROUND" button appears in the header only on pages with `turnaround: "yes"` and when the dataset contains items with `ifturnaround: "skip"`
- Starting a turnaround requires confirmation, resets all items, then pre-checks items marked with `ifturnaround: "skip"`

### 8.6 Phase Reset
- The "RESET" button in the header unchecks all items on the current page
- It also resets the voice engine state (`hasStartedReading = false`, cancels speech)

### 8.7 Global Flight Info Bar
The top bar displays a live summary of the current flight:
- Format: `{CALLSIGN} | {ORIGIN} > {DEST}`
- Updated on every briefing change
- Hidden when no data is entered
- Truncated with ellipsis on small screens

### 8.8 Checkbox Sound & Haptic Feedback
- **Sound:** A "knock" WAV file plays at 10% volume when an item is checked (respects mute setting)
- **Haptic:** A 25ms vibration pulse is triggered on check (on devices that support `navigator.vibrate`)

---

*Last updated: 2026-05-10*
