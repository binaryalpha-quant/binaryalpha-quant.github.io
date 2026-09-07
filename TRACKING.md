# Marketing tracking (Phase 0)

Static click + UTM instrumentation for
<https://binaryalpha-quant.github.io/>. No build step. No Meta/TikTok pixels.

## Setup: GA4 measurement ID

Pick one (do **not** commit secrets; a measurement ID like `G-XXXXXXXX` is fine
in the repo if you want it always on):

1. **Meta tag** in `index.html` `<head>`:

   ```html
   <meta name="ba-ga4-id" content="G-XXXXXXXX" />
   ```

2. **Or** set before `tracking.js` loads:

   ```html
   <script>window.BA_GA4_ID = 'G-XXXXXXXX';</script>
   <script src="tracking.js"></script>
   ```

If neither is set (or the value is empty / not a `G-…` ID), the page still
works: events are pushed to `window.dataLayer` and logged as
`console.info('[ba-track]', …)`. `gtag.js` is **not** loaded until a real ID
is present.

## Events

| Event | When | Key params |
| --- | --- | --- |
| `download_click` | Download CTAs (hero, nav, footer, platform cards) | `platform` |
| `discord_click` | Discord / Join Discord links | `location` |
| `youtube_click` | Watch on YouTube / Channel / footer YouTube | `location` |

### `download_click` — `platform` values

| Value | UI |
| --- | --- |
| `hero_download` | Hero primary download button |
| `nav_download` | Status bar “Download” (scrolls to `#downloads`) |
| `footer_download` | Footer “Download” |
| `windows_exe` | Windows installer card |
| `mac_arm_dmg` | Apple Silicon `.dmg` card |
| `mac_intel_dmg` | Intel Mac `.dmg` card |
| `linux_deb` | Debian/Ubuntu `.deb` card |
| `linux_appimage` | Linux AppImage card |

### `discord_click` — `location` values

`nav` · `hero` · `body` · `footer`

### `youtube_click` — `location` values

`watch` (demo caption) · `channel` (demo caption) · `footer`

## UTM / click IDs

On **first load** of a session, these query params (if present) are stored in
`sessionStorage` under `ba_attribution` and attached to **every** tracked
event:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `gclid`, `fbclid`

First-touch within the tab session: later navigations without UTMs keep the
original values.

### Example ad landing URL

```
https://binaryalpha-quant.github.io/?utm_source=reddit&utm_medium=paid&utm_campaign=whole_app_v1
```

Optional extras:

```
…&utm_content=carousel_a&utm_term=kalshi_bot
```

## Smoke test (before ads)

1. Open the site with UTMs, e.g.  
   `/?utm_source=reddit&utm_medium=paid&utm_campaign=whole_app_v1`
2. Open DevTools → Console. You should see `[ba-track] No GA4 ID…` (or
   `GA4 ready` once configured).
3. Click **Download** / **Join Discord** / **Watch on YouTube**.
4. Confirm lines like:

   ```
   [ba-track] download_click {platform: "hero_download", utm_source: "reddit", …}
   [ba-track] discord_click {location: "hero", utm_source: "reddit", …}
   [ba-track] youtube_click {location: "watch", utm_source: "reddit", …}
   ```

5. In Application → Session Storage, inspect `ba_attribution`.
6. With a GA4 ID set, also check GA4 **DebugView** / Realtime for the same
   event names.

Debug helpers (no secrets): `window.BA_TRACKING.getAttribution()`,
`window.BA_TRACKING.track('test', { foo: 1 })`, `window.dataLayer`.

## Files

| File | Role |
| --- | --- |
| `tracking.js` | UTM capture, optional gtag load, click delegation |
| `index.html` | `data-ba-*` attributes on CTAs; loads `tracking.js` first |
| `app.js` | Unrelated (platform detection / releases); left alone |
