# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- **Dev server:** `npm run dev` (or `./start.sh` which auto-installs deps first, runs with `--host --open`)
- **Build:** `npm run build`
- **Preview production build:** `npm run preview`

No test framework is configured.

## Architecture

Single-page React 18 app bundled with Vite 6. All styling is inline (no CSS files or framework).

### File Structure

- `index.html` — Entry point, mounts `#root`, loads `/src/main.jsx`
- `src/main.jsx` — React root render, imports `ClothingAlgo` from `App.jsx`
- `src/App.jsx` — Main orchestrator component (exported as `ClothingAlgo`), wires hooks to components
- `src/constants.js` — Shared constants (locations, onboarding questions, tier map)
- `src/utils.js` — Display helpers (getSkyLabel, getPrecipLabel, formatHour, formatTime12h)
- `src/weather-utils.js` — Pure weather computation functions
- `src/idb-config.js` — IndexedDB wrapper for SW-accessible config storage
- `src/sw.js` — Service worker (periodic sync, notifications)
- `src/hooks/` — Custom React hooks (useWeather, useLocation, useInstall, useNotifications)
- `src/components/` — UI components (CurrentPanel, HourCard, DayAheadPanel, TomorrowSummaryPanel, HeaderAction, OnboardingSurvey, SettingsModal, LocationBar, PersonalAdjSlider, ViewSwitcher, TierMap, ApiKeyEntry, NotifTimePicker)

### How It Works

DressIndex is a weather-based clothing recommendation tool for Florida. It fetches hourly weather from the [PirateWeather API](https://pirateweather.net) and computes an "effective temperature" by applying modifiers to the actual temperature:

1. **Modifier functions** (`getWindMod`, `getSkyMod`, `getPrecipMod`, `getTimeMod`, `dewPointMod`) each return a numeric adjustment based on wind speed, cloud cover, precipitation, time-of-day/sunset proximity, and dew point
2. **`computeEffective()`** sums all modifiers plus a user-controlled personal adjustment to produce the effective temperature
3. **`getClothing()`** maps effective temp to one of 4 clothing tiers: T-Shirt/Shorts (≥72), Crew Neck/Shorts (66-72), Hoodie/Shorts (58-66), Jacket/Pants (<58)

### Key Components

- **`ClothingAlgo`** (`src/App.jsx`) — Main app orchestrator; wires custom hooks to UI components
- **`CurrentPanel`** — Displays current conditions with effective temp breakdown showing each modifier's contribution
- **`HourCard`** — Individual hour in the scrollable 9AM-11PM timeline; highlights the current hour, dims past hours
- **`DayAheadPanel`** — Rest-of-day advisory comparing current vs coldest future conditions
- **`TomorrowSummaryPanel`** — Tomorrow outfit recommendation with coldest/warmest/sunset slots

### Custom Hooks

- **`useWeather`** — Weather fetching, auto-refresh, hourly slicing (today/tomorrow timeline + outfit)
- **`useLocation`** — Geolocation, location switching, home location persistence
- **`useInstall`** — PWA install prompt handling
- **`useNotifications`** — Notification permission, scheduling (3-layer system), SW messaging

### API & Environment

- Uses PirateWeather API (free tier): `https://api.pirateweather.net/forecast/{key}/{lat},{lng}?units=us`
- API key loaded from `VITE_PIRATE_WEATHER_API_KEY` env var (in `.env`), with fallback to manual entry in the UI
- Default location: Bay Lake, FL (28.3922, -81.5812); user can override via browser geolocation
