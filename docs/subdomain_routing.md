# Subdomain Routing

This document describes the subdomain-based routing system implemented in `src/middleware.ts`.

---

## 1. Purpose

The routing middleware enables short, memorable URLs for direct aircraft access:

| Instead of... | Users can type... |
|---|---|
| `charlie-lima.eu/b738` | `b738.charlie-lima.eu` |
| `charlie-lima.eu/creator` | `creator.charlie-lima.eu` |

The system is **transparent** — the user sees the subdomain URL in the browser, but internally the request is rewritten to the appropriate Next.js route.

---

## 2. Implementation

The middleware lives in `src/middleware.ts` and runs on **every request** before the Next.js router processes it.

### 2.1 Detection Logic

```typescript
const host = request.headers.get('host') || '';
const subdomain = host.split('.')[0];
```

1. Extract the `Host` header from the incoming request
2. Split on `.` and take the first segment as the potential subdomain
3. If the subdomain is **not** one of the known "root" values (`charlie-lima`, `www`, `localhost`) → treat it as a valid aircraft/tool subdomain

### 2.2 Static Asset Exclusion

Before rewriting, the middleware checks if the request is for a static asset by testing the pathname against this pattern:

```typescript
const isStatic = /^\/(data|icons|audio|_next|api|favicon|manifest)\b|\.(?:js|css|svg|png|ico|wav|json|webmanifest)$/i
```

If the request matches → **no rewrite** (static assets are served directly).

This is critical because without this check, requests like `b738.charlie-lima.eu/script.js` would be rewritten to `/b738/script.js`, which doesn't exist.

### 2.3 Rewrite Rules

| Subdomain | Rewrites to | Notes |
|---|---|---|
| `b738` | `/b738` | Dynamic route `(checklist)/[aircraft]` |
| `a320` | `/a320` | Any future aircraft follows the same pattern |
| `creator` | `/creator.html` | Special case — serves the static HTML file directly |
| *(any other)* | `/{subdomain}` | Generic rewrite — any subdomain works if the route exists |

### 2.4 Code

```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const subdomain = host.split('.')[0];

    const isStatic = /^\/(data|icons|audio|_next|api|favicon|manifest)\b|\.(?:js|css|svg|png|ico|wav|json|webmanifest)$/i;

    if (
        subdomain &&
        subdomain !== 'charlie-lima' &&
        subdomain !== 'www' &&
        !subdomain.startsWith('localhost') &&
        !isStatic.test(request.nextUrl.pathname) &&
        request.nextUrl.pathname === '/'
    ) {
        if (subdomain === 'creator') {
            const url = request.nextUrl.clone();
            url.pathname = '/creator.html';
            return NextResponse.rewrite(url);
        }

        const url = request.nextUrl.clone();
        url.pathname = `/${subdomain}`;
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image).*)"],
};
```

---

## 3. Matcher Configuration

The `config.matcher` restricts which paths the middleware is invoked on:

```typescript
matcher: ["/((?!_next/static|_next/image).*)"]
```

This negative lookahead excludes:
- `/_next/static/` — Next.js compiled assets
- `/_next/image/` — Next.js image optimization routes

All other paths trigger the middleware (but may exit early via the static asset regex).

---

## 4. Important Conditions

The rewrite **only happens** when ALL of these conditions are true:

1. A valid subdomain is detected (not empty)
2. The subdomain is not `charlie-lima`, `www`, or `localhost*`
3. The request path is NOT a static asset (regex check)
4. The request path is exactly `/` (root path)

**Condition 4 is crucial:** The middleware only rewrites **root path** requests (`/`). This means `b738.charlie-lima.eu/some-path` is NOT rewritten — only `b738.charlie-lima.eu/` is rewritten to `/b738`.

This prevents subdomain requests for nested paths from being incorrectly rewritten (e.g., `b738.charlie-lima.eu/api/datasets` works normally).

---

## 5. Local Development

During local development (`npm run dev`), subdomains are not naturally available. To test subdomain routing locally:

1. **Modify the hosts file** (`/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts`):
   ```
   127.0.0.1  b738.localhost
   127.0.0.1  creator.localhost
   ```

2. **Access via:** `http://b738.localhost:3000/`

The middleware checks `!subdomain.startsWith('localhost')` — so `b738.localhost` will be detected as subdomain `b738`, triggering the rewrite.

> **Note:** `localhost:3000` (without subdomain) routes normally to the landing page.

---

## 6. Adding a New Subdomain

To add support for a new aircraft subdomain (e.g., `a320.charlie-lima.eu`):

1. **Create the dataset directory:** `public/data/a320/` with at least one `.js` dataset file
2. **That's it** — the middleware generically rewrites any subdomain to `/{subdomain}`, and the `(checklist)/[aircraft]` dynamic route catches it automatically
3. The `/api/datasets` endpoint will discover the new aircraft directory on the next request

No code changes are needed in the middleware — it handles any subdomain generically.

---

*Last updated: 2026-05-10*
