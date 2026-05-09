# Versioning System Documentation

This document explains the centralized versioning system implemented in the Charlie-Lima (B738 Checklist) application.

## Single Source of Truth
The version of the application is defined in a single location:
- **File**: `package.json`
- **Field**: `"version"`

```json
{
  "name": "charlie-lima",
  "version": "3.3.7",
  ...
}
```

## How it Works

The application dynamically imports this version string to ensure consistency across the entire platform.

### 1. Import Mechanism
The version is imported in the main checklist page component:
- **File**: `src/app/(checklist)/[aircraft]/page.tsx`

```typescript
import pkg from '../../../../package.json';
const APP_VERSION = pkg.version;
```

### 2. Implementation Points
The `APP_VERSION` variable is used in two critical areas:

#### A. Cache Busting for `script.js`
To ensure users always receive the latest application logic without browser cache issues, the version is appended as a query parameter when loading the core script:
```typescript
await loadScript(`/script.js?v=${APP_VERSION}`);
```

#### B. UI Display (Footer)
The version is displayed in the global footer of the application:
```html
<div class="global-footer">
    <span class="version-info">v${APP_VERSION}</span>
    ...
</div>
```

## How to Update the Version
When releasing a new update or bug fix, follow these steps:

1. Open `package.json`.
2. Increment the `"version"` number (e.g., from `3.3.7` to `3.3.8`).
3. Save the file.
4. Deploy/Push the changes.

The changes will automatically propagate to the footer display and the script loading URL, forcing clients to reload the latest `script.js`.

---

## Versioning Convention

The version follows **semantic versioning** (`MAJOR.MINOR.PATCH`):

| Segment | Example | When to change |
|---|---|---|
| `PATCH` | `3.3.7` → `3.3.8` | Bug fixes, small tweaks, minor additions |
| `MINOR` | `3.3.7` → `3.4.0` | Significant new feature or larger refactor |
| `MAJOR` | `3.3.7` → `4.0.0` | Breaking changes, complete rewrites |

### Default Increment Rule

> **Unless explicitly told otherwise, always increment only the PATCH segment by 1.**

Examples of correct default increments:
- `3.3.7` → `3.3.8`
- `3.3.9` → `3.3.10`
- `3.3.19` → `3.3.20`

**Do not** bump MINOR or MAJOR unless the user specifically requests it (e.g. *"this is a minor version bump"* or *"increment minor version"*). Automatically jumping from `3.3.9` to `3.4.0` without instruction is incorrect.

---
*Last updated: 2026-05-09*
