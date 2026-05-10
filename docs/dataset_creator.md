# Dataset Creator

This document describes the visual dataset editor tool used for creating and modifying Charlie-Lima checklist datasets without writing code manually.

---

## 1. Overview

The Dataset Creator is a standalone HTML/JS/CSS application (`public/creator.html`, ~68 KB) that provides a visual editor for checklist datasets. It allows users to build complete checklist files compatible with the Charlie-Lima engine without manually editing JavaScript arrays.

### 1.1 Access URLs
| URL | How it works |
|---|---|
| `creator.charlie-lima.eu` | Subdomain rewrite → serves `/creator.html` |
| `charlie-lima.eu/creator` | Next.js route → wraps the creator tool |

### 1.2 Technology
- **Standalone:** Pure HTML + vanilla JavaScript + inline CSS
- **No dependencies:** Does not require Node.js, React, or any build step
- **Self-contained:** All UI, logic, and styling in a single file
- **No server interaction:** All data stays in the browser — nothing is uploaded

---

## 2. Core Capabilities

| Feature | Description |
|---|---|
| **Page Management** | Create, rename, reorder, and delete checklist pages |
| **Item Editing** | Add, edit, and delete checklist items within each page |
| **Type Assignment** | Assign item types: `flow`, `checklist item`, `briefing`, `fake_atc` |
| **Variable Support** | Insert `%variable%` placeholders from a dropdown of all available variables |
| **Subtype Tagging** | Mark items as `simplify` and/or `test` |
| **Timer Config** | Set countdown duration, label, warning target, and announcement text |
| **Turnaround** | Mark pages as turnaround-capable and items as turnaround-skippable |
| **Landing Type** | Restrict items to specific approach types (`1`, `2`, `3`, `2+3`) |
| **Import/Export** | Load existing `.js` datasets and export new ones |
| **Fake ATC Editor** | Multi-line text editor for ATC dialogue with role tagging |

---

## 3. User Workflow

### 3.1 Creating a New Dataset

```
1. Open the Creator at creator.charlie-lima.eu
       ↓
2. Click "Add Page" to create a new checklist section
       ↓
3. Name the page (e.g., "BEFORE START")
       ↓
4. Click "Add Item" within the page
       ↓
5. Fill in:
   - Name: "Parking brake"
   - Action: "Set"
   - Type: "flow" or "checklist item"
   - (Optional) Subtype, timer, etc.
       ↓
6. Repeat steps 2–5 for all pages and items
       ↓
7. Click "Export" → downloads a .js file
       ↓
8. Place the file in public/data/{aircraft}/
```

### 3.2 Editing an Existing Dataset

```
1. Open the Creator
       ↓
2. Click "Import" → select an existing .js file
       ↓
3. The editor loads all pages and items
       ↓
4. Make changes
       ↓
5. Click "Export" → downloads the updated file
```

---

## 4. Item Configuration Fields

### 4.1 Standard Item

| Field | Required | Description |
|---|---|---|
| **Name** | ✅ | The challenge text (left side). Supports `%variable%` syntax. |
| **Action** | ✅ | The response text (right side). Supports `%variable%` syntax. |
| **Type** | ✅ | `flow` \| `checklist item` \| `briefing` \| `fake_atc` |
| **Subtype** | ❌ | `simplify`, `test`, or both (controls visibility filters) |
| **Landing Type** | ❌ | `1` (RNAV), `2` (ILS Cat.I/II), `3` (ILS Cat.III), or `2+3` |
| **Timer** | ❌ | Duration in seconds (e.g., `120`) |
| **Timer Label** | ❌ | Text shown on the timer overlay (e.g., "APU START") |
| **Timer Warning** | ❌ | Name of another item that the voice engine should refuse to read until the timer finishes |
| **Timer Announcement** | ❌ | TTS phrase spoken when the timer starts |
| **Timer Continuous** | ❌ | If `"yes"`, the timer stays visible after completion |
| **If Turnaround** | ❌ | `"skip"` — auto-check this item in turnaround mode |

### 4.2 Briefing Item

Briefing items use the `name` field as a multi-sentence block. Each sentence should reference briefing variables:

```
EFIS BARO %dep_qnh%
```

The action field is typically left empty for briefing items, as they render as text blocks rather than challenge/response pairs.

### 4.3 Fake ATC Item

Fake ATC items use a `text` array instead of `name`/`action`. The Creator provides a multi-line text editor where each line becomes one sentence:

```
#pm %delivery_dep% %hello_dep% %callsign%
#pm at stand %dep_gate%
#atc %callsign% cleared to %city_arr%
```

Each line is stored as a separate string in the exported `text` array.

### 4.4 Page Properties

| Field | Description |
|---|---|
| **Title** | The section name shown in the header and Quick Navigation |
| **Turnaround** | If set to `"yes"`, enables the Turnaround button on this page |

---

## 5. Variable Picker

The Creator includes a searchable dropdown of all available variables that can be inserted into item text:

### 5.1 Briefing Variables
All fields from the Flight Briefing notepad are available:
- `%callsign%`, `%origin%`, `%dest%`
- `%dep_qnh%`, `%dep_rwy%`, `%dep_atis%`, `%sid%`, etc.
- `%v1%`, `%vr%`, `%v2%`, `%vref%`, `%trim%`
- `%arr_qnh%`, `%arr_rwy%`, `%star%`, `%ils_freq%`, `%course%`, etc.

### 5.2 ATC Variables
All variables resolved by the ATC engine:
- `%delivery_dep%`, `%delivery_dep_freq%`, `%ground_dep%`, `%ground_dep_freq%`
- `%tower_dep%`, `%tower_dep_freq%`, `%approach_dep%`, `%approach_dep_freq%`
- `%fir_dep%`, `%fir_dep_freq%`
- `%approach_arr%`, `%approach_arr_freq%`, `%tower_arr%`, `%tower_arr_freq%`
- `%ground_arr%`, `%ground_arr_freq%`, `%fir_arr%`, `%fir_arr_freq%`
- `%city_dep%`, `%city_arr%`
- `%hello_dep%`, `%bye_dep%`, `%hello_arr%`, `%bye_arr%`

---

## 6. Export Format

The exported file is a plain `.js` file that assigns to `window.initialChecklistData` and `window.checklistName`:

```javascript
window.checklistName = "B738 Europe Style";
window.initialChecklistData = [
    {
        "title": "PRELIMINARY PREFLIGHT",
        "turnaround": "yes",
        "items": [
            {
                "name": "Parking brake",
                "action": "Set",
                "type": "flow"
            },
            {
                "name": "EFIS BARO %dep_qnh%",
                "action": "Set",
                "type": "briefing"
            },
            {
                "type": "fake_atc",
                "text": [
                    "#pm %delivery_dep% %hello_dep% %callsign%",
                    "#atc %callsign% go ahead"
                ]
            }
        ]
    }
];
```

---

## 7. Import Compatibility

The Creator can import any existing Charlie-Lima dataset file. It:
1. Reads the file as text
2. Evaluates the JavaScript to extract `window.initialChecklistData` and `window.checklistName`
3. Populates the editor with all pages and items
4. Preserves all properties including timers, subtypes, and ATC text arrays

**Limitation:** The import relies on the file setting `window.initialChecklistData`. Files using a different global variable name will not be recognized.

---

## 8. Tips for Authors

1. **Always test exported files** by placing them in `public/data/{aircraft}/` and loading them in the actual application.
2. **Use the variable picker** rather than typing variables manually — this prevents typos in variable names.
3. **Briefing items** should use short, direct sentences. Each sentence should reference at most 2-3 variables to minimize the chance of the entire item being hidden due to missing data.
4. **Fake ATC items** should start each line with `#pm` or `#atc`. Lines without a role tag default to `#pm`.
5. **Use `#pause`** between frequency handover exchanges (e.g., between delivery and ground communications).
6. **Timer items** are best used for procedural waits like APU startup (120s), engine start stabilization, etc.

---

*Last updated: 2026-05-10*
