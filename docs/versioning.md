# Versioning System

This document describes the versioning rules and how the application version propagates through the system.

---

## 1. Single Source of Truth

The application version is defined in **one and only one location**:

```
package.json → "version": "3.3.48"
```

**There is no other version definition.** Every part of the system reads from `package.json`:
- The React component (`page.tsx`) imports `pkg.version` at build time
- `script.js` receives the version via the `?v=` query parameter (for cache busting)
- The footer displays it as `v{version}` in the bottom-left corner of the UI

---

## 2. Version Format

```
MAJOR . MINOR . PATCH
  3   .   3   .  48
```

| Segment | When to Increment | Frequency |
|---|---|---|
| **PATCH** | Every single `git push` to the `main` branch | Very often (sometimes daily) |
| **MINOR** | New feature set or significant functionality addition | Infrequently |
| **MAJOR** | Breaking architectural change or complete redesign | Rare |

### 2.1 The Golden Rule

> **1 push = 1 PATCH increment = 1 commit**

This rule exists because of the cache-busting mechanism. The version number is appended as a query parameter to `script.js`:

```html
<script src="/script.js?v=3.3.48"></script>
```

If the version doesn't change, browsers may serve a stale cached copy of `script.js`, causing bugs where updated logic isn't reflected. **Every push must increment the PATCH version** to guarantee fresh script delivery.

---

## 3. Version Propagation Flow

```
package.json  "version": "3.3.48"
     ↓
page.tsx      import pkg from '../../../../package.json'
              const APP_VERSION = pkg.version    // → "3.3.48"
     ↓
HTML Shell    <script src="/script.js?v=3.3.48">   // Cache bust
              <span class="version-info">v3.3.48</span>  // Footer display
     ↓
Browser       Fetches /script.js?v=3.3.48 → CDN serves fresh copy
```

---

## 4. Git Commit Rules

### 4.1 Commit Message Format

The commit message must contain **ONLY the version number**:

```bash
# ✅ Correct
git commit -m "3.3.49"

# ❌ Wrong — no descriptions allowed
git commit -m "3.3.49 - fixed voice bug"
git commit -m "fix: voice recognition timeout"
```

This convention ensures a clean, scannable commit history where each commit is exactly one version bump.

### 4.2 The Full Push Workflow

```bash
# 1. Make your code changes
# 2. Bump the version in package.json (e.g., 3.3.48 → 3.3.49)
# 3. If docs/ content was affected, update the relevant doc files
# 4. Stage everything
git add .
# 5. Commit with version-only message
git commit -m "3.3.49"
# 6. Push to trigger auto-deploy
git push
```

---

## 5. What Happens If You Forget?

| Scenario | Result |
|---|---|
| Push without version bump | Users may see stale `script.js` (old cached version from CDN) |
| Push without editing `package.json` | The `?v=` parameter stays the same, browser serves old script |
| Multiple changes in one push | Only one PATCH increment needed (all changes go out together) |
| Hotfix after a push | Must increment PATCH again (new push = new version) |

---

## 6. Historical Context

The versioning system was introduced to solve a specific problem:
- `script.js` is a large file (~138 KB) that is loaded via a `<script>` tag with a `?v=` query parameter
- CDNs (Vercel Edge) and browsers aggressively cache static files
- Without a unique version in the URL, users could be stuck with outdated application logic for extended periods
- By incrementing the version on every push, the query parameter changes, forcing a fresh fetch

---

*Last updated: 2026-05-10*
