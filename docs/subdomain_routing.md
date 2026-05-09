# Subdomain Routing

This document describes how subdomain-based routing works in the Charlie-Lima application.

---

## 1. How It Works

The application runs on the main domain `charlie-lima.eu`. Subdomains are handled by **Next.js Middleware** (`src/middleware.ts`), which runs on the server (Vercel Edge Network) before every request is processed.

The middleware reads the `Host` request header, extracts the subdomain, and internally **rewrites the URL path** without changing what the user sees in the browser address bar. This is a server-side rewrite, not a visible redirect.

```
Browser requests: b738.charlie-lima.eu/
Middleware rewrites to: charlie-lima.eu/b738
Next.js serves: /b738 (App Router route)
Browser still shows: b738.charlie-lima.eu/
```

---

## 2. Middleware Configuration

**File:** `src/middleware.ts`

### Matcher

```ts
export const config = {
  matcher: ['/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)'],
};
```

The middleware runs on **all paths except**:
- `/api/*` — API routes (handled directly by Next.js)
- `/_next/*` — Next.js internal assets (JS chunks, CSS)
- `/_static/*`, `/_vercel/*` — Vercel internal paths
- Any path ending with a file extension (e.g. `/script.js`, `/styles.css`, `/icons/logo.svg`)

### Processing Logic

```ts
// 1. Read the hostname (e.g. "b738.charlie-lima.eu")
let hostname = req.headers.get('host') || '';
hostname = hostname.split(':')[0]; // Strip any port number

// 2. If hostname ends with ".charlie-lima.eu" → it has a subdomain
if (hostname.endsWith(`.charlie-lima.eu`)) {
  const subdomain = hostname.replace(`.charlie-lima.eu`, '');

  // 3. Ignore "www" (www.charlie-lima.eu = main page)
  if (subdomain && subdomain !== 'www') {

    // 4. Special case: creator.charlie-lima.eu
    if (subdomain === 'creator') {
      url.pathname = '/creator.html';
      return NextResponse.rewrite(url);
    }

    // 5. All other subdomains → /subdomain + original path
    url.pathname = `/${subdomain}${req.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }
}
```

### Static Files — Exception

Static assets are excluded from the rewrite logic before anything else runs:

```ts
const path = url.pathname;
if (
  path.startsWith('/icons/') ||
  path.startsWith('/data/') ||
  path.startsWith('/audio/') ||
  path.endsWith('.js') ||
  path.endsWith('.css')
) {
  return NextResponse.next(); // Serve the file directly, no rewrite
}
```

This is critical — `script.js`, `styles.css`, dataset files under `/data/`, etc. must be served as-is without any path manipulation.

---

## 3. Subdomain Overview

| Browser URL | Rewrites to | Next.js Route | Description |
|---|---|---|---|
| `charlie-lima.eu` | — | `/(landing)/page.tsx` | Main page — aircraft list |
| `www.charlie-lima.eu` | — | `/(landing)/page.tsx` | Alias for the main page |
| `b738.charlie-lima.eu` | `/b738` | `/(checklist)/[aircraft]/page.tsx` | B738 checklist |
| `b738.charlie-lima.eu/something` | `/b738/something` | — | Subdomain + path are combined |
| `creator.charlie-lima.eu` | `/creator.html` | Static HTML file | Dataset Creator tool |

> **Note:** If you add a new aircraft (e.g. `a320`), the subdomain `a320.charlie-lima.eu` will work automatically — the middleware rewrites it to `/a320`, which Next.js handles via the existing `[aircraft]` dynamic route.

---

## 4. Why `creator` Is a Special Case

`creator.charlie-lima.eu` is handled differently — it does not rewrite to `/creator` (which would go into the Next.js App Router), but directly to `/creator.html`.

The file `public/creator.html` is a static HTML file served by Vercel from the `public/` directory. It is a self-contained application (not a Next.js component), so the rewrite must explicitly target the `.html` file.

```ts
if (subdomain === 'creator') {
  url.pathname = '/creator.html';
  return NextResponse.rewrite(url);
}
```

> **Important:** If the rewrite targeted `/creator` (without `.html`), Next.js would look for `/(creator)/creator/page.tsx` — this route exists but serves different content, and the static tool would not be accessible.

---

## 5. Local Development

The middleware works identically in local development (`npm run dev`), but subdomains do not function automatically on `localhost`. When developing locally:

- Access routes directly **without a subdomain**: `http://localhost:3000/b738`
- The subdomain rewrite will not trigger because `localhost` does not end with `.charlie-lima.eu`
- All routes work normally via their path equivalents

---

## 6. Adding a New Subdomain

### Automatic (new aircraft)
Simply create a new folder at `public/data/{aircraft}/` containing at least one `.js` dataset file. The subdomain `{aircraft}.charlie-lima.eu` will work automatically with no middleware changes required.

### Manual (special case)
If you need a new subdomain with different behaviour than the standard aircraft checklist, add a condition to the middleware before the main rewrite logic:

```ts
if (subdomain === 'my-new-subdomain') {
  url.pathname = '/my-target-path';
  return NextResponse.rewrite(url);
}
```

---

*Last updated: 2026-05-09*
