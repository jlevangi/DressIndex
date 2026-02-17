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
- `src/main.jsx` — React root render, imports the main component
- `DressIndex.jsx` — **Entire application lives in this single file** (exported as `ClothingAlgo`)

### How It Works

DressIndex is a weather-based clothing recommendation tool for Florida. It fetches hourly weather from the [PirateWeather API](https://pirateweather.net) and computes an "effective temperature" by applying modifiers to the actual temperature:

1. **Modifier functions** (`getWindMod`, `getSkyMod`, `getPrecipMod`, `getTimeMod`, `dewPointMod`) each return a numeric adjustment based on wind speed, cloud cover, precipitation, time-of-day/sunset proximity, and dew point
2. **`computeEffective()`** sums all modifiers plus a user-controlled personal adjustment to produce the effective temperature
3. **`getClothing()`** maps effective temp to one of 4 clothing tiers: T-Shirt/Shorts (≥72), Crew Neck/Shorts (66-72), Hoodie/Shorts (58-66), Jacket/Pants (<58)

### Key Components

- **`ClothingAlgo`** — Main app component; manages API key, geolocation, weather fetching (auto-refreshes every 15 min), personal adjustment slider
- **`CurrentPanel`** — Displays current conditions with effective temp breakdown showing each modifier's contribution
- **`HourCard`** — Individual hour in the scrollable 6AM-11PM timeline; highlights the current hour, dims past hours

### API & Environment

- Uses PirateWeather API (free tier): `https://api.pirateweather.net/forecast/{key}/{lat},{lng}?units=us`
- API key loaded from `VITE_PIRATE_WEATHER_API_KEY` env var (in `.env`), with fallback to manual entry in the UI
- Default location: Bay Lake, FL (28.3922, -81.5812); user can override via browser geolocation
