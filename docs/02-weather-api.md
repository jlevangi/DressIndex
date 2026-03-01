# Weather Data Pipeline

Source files: `src/hooks/useWeather.js`, `src/App.jsx`

---

## API Endpoint

**Provider**: [PirateWeather](https://pirateweather.net) (free tier, Dark Sky–compatible API)

**URL format**:
```
https://api.pirateweather.net/forecast/{apiKey}/{lat},{lng}?units=us
```

**Units**: `us` (Fahrenheit, mph, inches/hour)

---

## API Key Resolution

The API key is resolved in this priority order:

1. `window.__CONFIG__.PIRATE_WEATHER_API_KEY` — injected at runtime by Docker entrypoint
2. `import.meta.env.VITE_PIRATE_WEATHER_API_KEY` — Vite env var from `.env` file
3. Manual entry via `ApiKeyEntry` component in the UI (if both above are empty)

The resolved key is stored in React state (`apiKey`). It is NOT persisted to storage — on page reload, the resolution runs again.

---

## Response Structure

The app reads these fields from the API response:

### `currently` (object)
Used for the CurrentPanel display. Fields consumed:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `temperature` | number | 0 | Air temperature in °F |
| `apparentTemperature` | number | — | "Feels like" temp (display only) |
| `windSpeed` | number | 0 | Wind speed in mph |
| `cloudCover` | number | 0 | 0.0–1.0 fraction |
| `precipIntensity` | number | — | Inches/hour |
| `precipProbability` | number | — | 0.0–1.0 fraction |
| `uvIndex` | number | — | Integer scale |
| `dewPoint` | number | 50 | Dew point in °F |
| `humidity` | number | — | 0.0–1.0 fraction (display only) |
| `time` | number | — | Unix timestamp (seconds) |

### `hourly.data` (array of objects)
Each element has the same fields as `currently`. Used for timeline display and day recommendation calculations.

### `daily.data` (array of objects)
Only two fields are read:

| Field | Path | Description |
|-------|------|-------------|
| `sunsetTime` | `daily.data[0].sunsetTime` | Today's sunset (Unix seconds) |
| `sunsetTime` | `daily.data[1].sunsetTime` | Tomorrow's sunset (Unix seconds) |

---

## Time Slicing

The raw `hourly.data` array (up to 48 hours) is filtered into four slices using Unix timestamps:

| Slice Name | Hours | Purpose | Used By |
|------------|-------|---------|---------|
| `hourlySlice` | Today 9 AM–8 PM | Outfit recommendations, DayAheadPanel | `DayAheadPanel`, `App.jsx` |
| `todayTimelineSlice` | Today 7 AM–11 PM | Scrollable timeline display | `HourCard` list |
| `tomorrowHourlySlice` | Tomorrow 9 AM–8 PM | Tomorrow outfit recommendations | `TomorrowSummaryPanel` |
| `tomorrowTimelineSlice` | Tomorrow 7 AM–11 PM | Tomorrow timeline display | `HourCard` list |

All slices use **inclusive** boundaries (both start and end timestamps are included).

Slice boundaries are computed from the client's local date/time using `new Date()`.

### Current Hour Detection

`nowHourTs` identifies the current hour in today's timeline:

```
For each hour in todayTimelineSlice:
  find the one whose timestamp is closest to Date.now()
Return that hour's timestamp
```

This is used by `HourCard` to show the "NOW" badge.

---

## Auto-Refresh

Weather data is fetched:
1. **Immediately** when `apiKey`, `lat`, or `lng` changes
2. **Every 15 minutes** via `setInterval(fetchWeather, 15 * 60 * 1000)`

The interval is cleared and re-created whenever `apiKey`, `lat`, or `lng` changes.

---

## Error Handling

- Non-OK HTTP responses throw with `API {status}: {first 200 chars of body}`
- Network errors surface the native error message
- Errors are stored in `error` state and displayed as a red banner in the UI
- The error is cleared on the next fetch attempt
