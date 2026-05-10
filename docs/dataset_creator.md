# Dataset Creator Tool

The **Dataset Creator** (`public/creator.html`) is a standalone visual editor designed to create, modify, and manage aircraft checklist datasets for Charlie-Lima without writing raw JavaScript.

---

## 1. Overview & Workspace

The tool provides a two-column interface:
- **Left Column (Workspace):** Displays the visual structure of sections and items.
- **Right Column (Toolbox):** Contains dataset selection, draft management, and the Variable Library.

---

## 2. Managing Sections

Sections represent the "pages" or "phases" of a checklist (e.g., "Preflight", "Before Start").

- **Adding/Deleting:** Use the "+ Add New Section" button at the top of the toolbox.
- **Reordering:** Drag the `⣿` handle on the left of a section header to move it.
- **Turnaround Toggle:** The circular arrow icon in the header toggles whether this section contains items relevant to a Turnaround flight.
- **Collapsing:** Sections can be collapsed to simplify the view during large-scale editing.

---

## 3. Item Types & Properties

Every item in a section has a specific **Type** that dictates its behavior in the main application:

| Type | UI Representation | Voice Behavior |
|---|---|---|
| **Flow** | Normal text | Ignored in "Checklist Only" mode. |
| **Checklist Item** | Red "Checklist" marker | Core formal items; always read in all modes. |
| **Briefing** | Indented grey block | Dynamic text block; paused/skipped in "Read CL Only". |
| **Fake ATC** | Indented orange block | Dialogue block; supports #pm/#atc role switching. |

### 3.1 Item Flags
- **Test:** Hides the item if the user enables "Hide Tests" in the app.
- **Simplify:** Hides the item in "Simplify" mode.
- **Skip on turn:** Hides the item when the app is in "Turnaround" mode.
- **Landing Type [1][2][3]:** Filters item visibility based on the selected Landing Type in the Briefing notepad.

---

## 4. Advanced Features

### 4.1 Timer Configuration
Clicking the ⏱ icon opens the **Timer Modal**, allowing you to attach a countdown to an item:
- **Duration:** Seconds for the countdown.
- **Label:** Text shown inside the timer circle.
- **Announcement:** TTS phrase spoken when the timer starts.
- **Continuous:** If checked, the timer runs in the background, allowing the checklist to proceed immediately.
- **Warning Item:** If set, the voice engine will refuse to check off the target item until this timer finishes.

### 4.2 Briefing & Fake ATC Authoring
For Briefing and ATC items, you can use **Variables** (e.g., `%dep_rwy%`, `%vref%`).
- **Variable Library:** Drag and drop badges from the right toolbox directly into the textarea.
- **Visibility Rule:** A line or block containing variables will be **automatically hidden** in the application if the corresponding variables are not filled out in the notepad.

---

## 5. Data Workflow

### 5.1 Persistence (Drafts)
The tool automatically saves a "Draft" to your browser's `localStorage` for every unique file you edit. 
- You can leave the page and return later; your changes will persist.
- Use **"Clear Draft"** to revert to the original file state.

### 5.2 Exporting
- **Download .js:** Generates a production-ready `.js` file.
- **Copy to Clipboard:** Copies the `initialChecklistData` array for manual pasting into a codebase.

### 5.3 Importing
- **Upload Custom .js:** You can drag any existing Charlie-Lima dataset file into the browser to edit it.

---

*Last updated: 2026-05-10*
