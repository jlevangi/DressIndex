# Project Overview

## What Is DressIndex?

DressIndex is a weather-based clothing recommendation app. It fetches hourly weather data, computes an "effective temperature" by applying environmental modifiers (wind, clouds, precipitation, UV, humidity) plus a personal comfort calibration, and maps the result to one of 8 clothing tiers with accessory suggestions.

Originally built for Florida but works for any location with lat/lng coordinates.

---

## Data Flow

```
                    PirateWeather API
                          │
                          ▼
                   ┌─────────────┐
                   │  useWeather  │  fetch, auto-refresh (15 min),
                   │              │  slice hourly data into windows
                   └──────┬──────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────────┐
   │ currentData│  │ hourlySlice│  │tomorrowSlice   │
   │ (now)      │  │ (today)    │  │(tomorrow)      │
   └─────┬──────┘  └─────┬──────┘  └───────┬────────┘
         │               │                 │
         ▼               ▼                 ▼
   ┌──────────────────────────────────────────────┐
   │           weather-utils.js                    │
   │  computeEffective() → getClothing()          │
   │  getAccessoryTags() → getDayRecommendation() │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  UI Components│
              │  (rendering)  │
              └──────────────┘
```

---

## Module Dependency Map

| Doc File | Depends On | Referenced By |
|----------|------------|---------------|
| [01-algorithm](01-algorithm.md) | — | All other docs |
| [02-weather-api](02-weather-api.md) | 01-algorithm | 05-notifications |
| [03-onboarding](03-onboarding.md) | 01-algorithm | 04-comfort-survey, 07-persistence |
| [04-comfort-survey](04-comfort-survey.md) | 01-algorithm, 03-onboarding | 07-persistence |
| [05-notifications](05-notifications.md) | 01-algorithm, 02-weather-api | 07-persistence |
| [06-location](06-location.md) | — | 03-onboarding, 07-persistence |
| [07-persistence](07-persistence.md) | — | All hooks |
| [08-theme](08-theme.md) | — | 09-ui-components |
| [09-ui-components](09-ui-components.md) | 01-algorithm, 08-theme | — |
| [10-platform](10-platform.md) | 05-notifications | — |

---

## Glossary

| Term | Definition |
|------|------------|
| **Effective temperature** | Base air temperature + sum of all modifier adjustments + personal calibration. This is the number used to select a clothing tier. |
| **Modifier** | A function that returns a numeric adjustment (°F) based on one weather variable. Six modifiers exist: wind, sky, precip, UV, dew point, personal. |
| **Personal adjustment** | User-controlled offset (-10 to +10 °F) reflecting individual cold/heat sensitivity. Set during onboarding, adjustable anytime. |
| **Tier** | One of 8 clothing recommendation levels, each with a top, bottom, and display color. Selected by effective temperature thresholds. |
| **Accessory tag** | A supplementary recommendation (e.g., "Umbrella", "Sunscreen") triggered by specific weather conditions independent of the tier. |
| **Hourly slice** | A filtered subset of the 48-hour hourly forecast, limited to a specific time window (e.g., 9 AM–8 PM). |
| **Home location** | The user's default saved location, persisted to localStorage. |
| **Outfit window** | 9 AM–8 PM: the hours used for clothing recommendation calculations. |
| **Timeline window** | 7 AM–11 PM: the hours displayed in the scrollable hour-by-hour view. |

---

## App Render States

The app has four top-level render states, evaluated in order:

1. **Loading** (`onboardingDone === null`): Shows brand header + skeleton loader with "Booting..." message. Waiting for IndexedDB read of onboarding state.

2. **Onboarding** (`onboardingDone === false`): Full-screen OnboardingSurvey component. See [03-onboarding](03-onboarding.md).

3. **No API Key** (`apiKey` is empty): Shows ApiKeyEntry form for manual key input. Only reached if `VITE_PIRATE_WEATHER_API_KEY` env var and `window.__CONFIG__.PIRATE_WEATHER_API_KEY` are both missing.

4. **Normal Operation**: Location bar, view switcher, weather panels, timeline, tier map. Two sub-views toggled by ViewSwitcher:
   - **Today**: CurrentPanel → SurveyCard → DayAheadPanel → Today's Timeline
   - **Tomorrow**: TomorrowSummaryPanel → Tomorrow's Timeline

---

## Global Design Constants

| Constant | Value | Usage |
|----------|-------|-------|
| Accent color | `#f97316` (orange) | Buttons, highlights, active states, personal adj display |
| Text on accent | `#000` (black) | Button text on orange backgrounds |
| Font family | `'JetBrains Mono', 'Fira Code', monospace` | All text throughout the app |
| Font source | Google Fonts CDN | Loaded via `<link>` in component render |
| Max content width | `640px` | Centered container for all content |
| Error color | `#ef4444` | Error messages, Hoodie tier |
| Success color | `#22c55e` | T-Shirt tier, "Spot On" survey response |
| Info color | `#60a5fa` | Umbrella tag, info highlights |
