# Theme System

Source files: `src/theme.css`, `src/hooks/useTheme.js`, `index.html`

---

## Modes

Three theme modes:

| Mode | `data-theme` attribute | Behavior |
|------|----------------------|----------|
| Dark | `"dark"` (or absent — `:root` defaults) | Dark backgrounds, light text |
| Light | `"light"` | Light backgrounds, dark text |
| Auto | `"auto"` | Follows system `prefers-color-scheme` via CSS `@media` |

Default on first visit: `"auto"`

---

## CSS Custom Properties

Defined in `src/theme.css`. All components use `var(--token)` in inline styles.

| Token | Dark (`#`) | Light (`#`) | Purpose |
|-------|-----------|------------|---------|
| `--bg-page` | `0a0a0a` | `ededed` | Page background |
| `--bg-card` | `141414` | `ffffff` | Card/panel backgrounds |
| `--bg-secondary` | `1c1c1c` | `f7f7f7` | Secondary backgrounds |
| `--bg-input` | `0e0e0e` | `f3f3f3` | Input field backgrounds |
| `--bg-hover` | `2a2a2a` | `e2e2e2` | Hover states |
| `--border` | `222` | `d4d4d4` | Default borders |
| `--border-btn` | `383838` | `c0c0c0` | Button borders |
| `--text-heading` | `f0f0f0` | `111` | Headings |
| `--text` | `e0e0e0` | `222` | Body text |
| `--text-secondary` | `d0d0d0` | `3a3a3a` | Secondary text |
| `--text-muted` | `aaa` | `555` | Muted text |
| `--text-dim` | `909090` | `666` | Dim text |
| `--text-label` | `757575` | `777` | Labels |
| `--text-faint` | `606060` | `888` | Faintest text |
| `--text-disabled` | `484848` | `aaa` | Disabled elements |
| `--overlay` | `rgba(0,0,0,0.7)` | `rgba(0,0,0,0.4)` | Modal overlays |
| `--shimmer` | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.06)` | Skeleton shimmer effect |

---

## Hardcoded Colors (Theme-Independent)

These colors never change between light and dark modes:

| Color | Hex | Usage |
|-------|-----|-------|
| Accent | `#f97316` | Buttons, active states, highlights |
| Text on accent | `#000` | Text on orange buttons |
| Error/destructive | `#ef4444` | Error messages, Hoodie tier |
| Success | `#22c55e` | T-Shirt tier, positive indicators |
| Info | `#60a5fa` | Umbrella tag, informational |
| Tier: Topless | `#ec4899` | Pink |
| Tier: Crew Neck | `#eab308` | Yellow |
| Tier: Light Jacket+Shorts | `#f97316` | Orange |
| Tier: Light Jacket+Pants | `#ea580c` | Dark orange |
| Tier: Medium Coat | `#3b82f6` | Blue |
| Tier: Winter Coat | `#8b5cf6` | Purple |
| Windbreaker tag | `#3b82f6` | Blue |
| Rain Jacket tag | `#67e8f9` | Cyan |
| Sunscreen tag | `#facc15` | Yellow |
| Bring a Layer tag | `#a78bfa` | Light purple |

---

## Anti-Flash Script

Located in `index.html` `<head>`, runs synchronously before first paint:

```javascript
(function(){
  var t = localStorage.getItem('dressindex_theme') || 'auto';
  document.documentElement.setAttribute('data-theme', t);
  var light = t === 'light' ||
    (t === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);
  var mc = document.querySelector('meta[name="theme-color"]');
  if (mc) mc.setAttribute('content', light ? '#ededed' : '#0a0a0a');
})();
```

This prevents the flash of wrong-theme colors before React hydrates.

---

## Meta Theme-Color

The `<meta name="theme-color">` tag controls the browser/OS chrome color:

| Theme | Color |
|-------|-------|
| Light | `#ededed` |
| Dark | `#0a0a0a` |

Updated in three places:
1. Anti-flash script (on page load)
2. `useTheme` hook (on theme change)
3. `useTheme` hook (on system preference change, for auto mode)

---

## useTheme Hook

### State

- `themePref`: The user's selected mode (`"light"`, `"dark"`, `"auto"`)
- `resolvedTheme`: The actual mode being displayed (`"light"` or `"dark"`)

### `setTheme(pref)`

1. Updates React state
2. Writes to `localStorage` key `dressindex_theme`
3. Writes to IndexedDB key `theme` (secondary/backup)
4. Sets `data-theme` attribute on `<html>`
5. Updates meta theme-color

### System Preference Listener

In auto mode, listens to `matchMedia("(prefers-color-scheme: light)")` changes and updates `resolvedTheme` + meta theme-color accordingly.

---

## CSS Architecture

The `theme.css` file uses three selector strategies:

1. `:root { ... }` — Dark theme defaults (always present)
2. `[data-theme="light"] { ... }` — Explicit light overrides
3. `@media (prefers-color-scheme: light) { [data-theme="auto"] { ... } }` — Auto mode light overrides

Dark theme values serve as the fallback when no attribute is set. The light values are identical between the explicit `[data-theme="light"]` and the auto-mode media query selectors.
