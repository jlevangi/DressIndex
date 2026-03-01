# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- **Dev server:** `npm run dev` (or `./start.sh` which auto-installs deps first, runs with `--host --open`)
- **Build:** `npm run build`
- **Preview production build:** `npm run preview`

No test framework is configured.

## Architecture

Single-page React 18 app bundled with Vite 6. All styling is inline using CSS custom properties from `src/theme.css` (no CSS framework).

DressIndex fetches hourly weather from the [PirateWeather API](https://pirateweather.net) and computes an **effective temperature** by summing 6 modifiers (wind, sky, precip, UV, dew point, personal adjustment) with the base temperature. The effective temperature maps to one of **8 clothing tiers** (from Topless+Speedo at ≥85°F down to Winter Coat+Pants at <30°F), with 5 possible accessory tags (Windbreaker, Rain Jacket, Umbrella, Sunscreen, Bring a Layer).

### Key Files

- `src/weather-utils.js` — Core algorithm: modifier functions, `computeEffective()`, `getClothing()`, `getAccessoryTags()`, `getDayRecommendation()`
- `src/constants.js` — `DEFAULT_HOME`, `PRESET_LOCATIONS`, `ONBOARDING_QUESTIONS`, `TIER_MAP`
- `src/App.jsx` — Main orchestrator (`ClothingAlgo`), wires hooks to components
- `src/hooks/` — `useWeather`, `useLocation`, `useInstall`, `useNotifications`, `useSurvey`, `useTheme`
- `src/components/` — 16 components (see [09-ui-components](docs/09-ui-components.md))
- `src/theme.css` — 17 CSS custom properties for dark/light/auto modes
- `src/idb-config.js` — IndexedDB wrapper (database: `dressindex`, store: `config`)
- `src/sw.js` — Service worker (precache, periodic sync, notifications)
- `src/firebase.js` — Optional Firebase anonymous auth + Firestore event logging
- `src/geocode.js` — Nominatim forward search + reverse geocoding

### API & Environment

- PirateWeather API: `https://api.pirateweather.net/forecast/{key}/{lat},{lng}?units=us`
- API key: `window.__CONFIG__` (Docker) → `VITE_PIRATE_WEATHER_API_KEY` (.env) → manual UI entry
- Default home: Davenport, FL (28.1614, -81.6137)

## Specification Docs

Complete language-agnostic specifications live in `docs/`. These document every algorithm, threshold, state machine, and data contract needed to reimplement the app.

| File | Description |
|------|-------------|
| [00-overview](docs/00-overview.md) | Architecture, data flow, glossary, app render states |
| [01-algorithm](docs/01-algorithm.md) | **Core algorithm**: all 6 modifiers, 8 clothing tiers, accessory tags, day recommendation |
| [02-weather-api](docs/02-weather-api.md) | API contract, response fields, time slicing, auto-refresh |
| [03-onboarding](docs/03-onboarding.md) | 5-question survey, personalAdj calculation, flow steps |
| [04-comfort-survey](docs/04-comfort-survey.md) | Recurring survey, pattern detection, extended questions |
| [05-notifications](docs/05-notifications.md) | Three-layer notification system, service worker behavior |
| [06-location](docs/06-location.md) | GPS, home, saved/preset locations, geocoding |
| [07-persistence](docs/07-persistence.md) | IndexedDB + localStorage schema with all keys/types/defaults |
| [08-theme](docs/08-theme.md) | CSS custom properties, dark/light/auto modes, anti-flash |
| [09-ui-components](docs/09-ui-components.md) | All 16 components: hierarchy, props, state machines |
| [10-platform](docs/10-platform.md) | PWA, Docker, Capacitor/Android, Firebase, cross-platform deps |
