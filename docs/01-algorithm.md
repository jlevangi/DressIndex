# Core Algorithm

This is the most critical specification file. It documents the complete effective temperature algorithm, clothing tier system, and accessory logic. Any reimplementation must reproduce these exact thresholds and formulas.

Source files: `src/weather-utils.js`, `src/constants.js`

---

## Constants

```
DRIZZLE_INTENSITY = 0.01
```

All temperatures are in Fahrenheit. Wind speed is in mph. Cloud cover, precipitation probability are 0.0–1.0 fractions. Precipitation intensity is in inches/hour. UV index is a unitless integer scale (0–11+). Dew point is in Fahrenheit.

---

## Modifier Functions

Five modifier functions each return a numeric adjustment (positive = warmer feel, negative = colder feel) that gets added to the base temperature.

### `getWindMod(speed, baseTemp)` → number

Wind chill effect, scaled by how cold it already is.

| Wind Speed (mph) | Raw Value |
|-------------------|-----------|
| ≤ 10              | 0         |
| 11–15             | -2        |
| 16–20             | -4        |
| > 20              | -6        |

The raw value is then scaled by a temperature factor:

```
tempFactor = clamp((75 - baseTemp) / 25, 0, 1)
result = round(raw * tempFactor, 1 decimal)
```

This means wind chill has no effect when baseTemp ≥ 75°F, full effect when baseTemp ≤ 50°F, and linear interpolation between.

### `getSkyMod(cloudCover)` → number

Cloud cover cooling effect.

| Cloud Cover | Return |
|-------------|--------|
| < 0.3       | 0      |
| 0.3 to < 0.7 | -1.5 |
| ≥ 0.7       | -3     |

### `getPrecipMod(intensity, probability)` → number

Precipitation cooling effect. Returns 0 if both conditions are mild.

**Early exit**: If intensity is falsy or < 0.01 AND probability ≤ 0.5, return 0.

Otherwise, compute a base:

| Intensity (in/hr) | Base |
|--------------------|------|
| ≥ 0.1              | -4   |
| ≥ 0.01             | -2   |
| < 0.01             | 0    |

Then if probability > 0.5, subtract an additional 2.

**Return range**: 0 to -6

### `getUvMod(uvIndex)` → number

UV warming effect (sun exposure makes it feel warmer).

| UV Index | Return |
|----------|--------|
| null/< 3 | 0      |
| 3–5      | +1.5   |
| 6–8      | +3     |
| ≥ 9      | +4     |

### `dewPointMod(dp, precipIntensity, precipProbability)` → number

Humidity warming effect. **Suppressed entirely when it's raining** (rain already dominates the "feels muggy" perception).

**Rain suppression check**: If precipIntensity ≥ 0.01 OR precipProbability > 0.5, return 0.

| Dew Point (°F) | Return |
|-----------------|--------|
| ≥ 65            | +3     |
| 60–64           | +2     |
| 55–59           | +1     |
| < 55            | 0      |

### Summary Table

| Modifier | Min | Max | Warming/Cooling |
|----------|-----|-----|-----------------|
| Wind     | -6  | 0   | Cooling only    |
| Sky      | -3  | 0   | Cooling only    |
| Precip   | -6  | 0   | Cooling only    |
| UV       | 0   | +4  | Warming only    |
| Dew Pt   | 0   | +3  | Warming only    |
| Personal | -10 | +10 | Either          |

---

## `computeEffective(data, personalAdj)` → object

Computes the effective temperature from raw weather data.

**Input fields read from `data`**:
- `temperature` (default 0)
- `windSpeed` (default 0)
- `cloudCover` (default 0)
- `precipIntensity` (no default)
- `precipProbability` (no default)
- `uvIndex` (no default)
- `dewPoint` (default 50)

**Formula**:
```
baseTemp = data.temperature || 0
wind     = getWindMod(data.windSpeed || 0, baseTemp)
sky      = getSkyMod(data.cloudCover || 0)
precip   = getPrecipMod(data.precipIntensity, data.precipProbability)
uv       = getUvMod(data.uvIndex)
dewPt    = dewPointMod(data.dewPoint || 50, data.precipIntensity || 0, data.precipProbability || 0)
total    = wind + sky + precip + uv + dewPt + personalAdj
effective = baseTemp + total
```

**Return value**:
```
{
  base: number,       // raw temperature
  effective: number,  // base + total
  mods: {
    wind: number,
    sky: number,
    precip: number,
    uv: number,
    dewPt: number,
    personal: number
  },
  total: number       // sum of all mods
}
```

---

## Clothing Tier System

### `getClothing(eff, data?)` → { top, bottom, color }

Maps effective temperature to one of 8 clothing tiers.

| Tier | Effective Temp | Top           | Bottom | Hex Color  |
|------|----------------|---------------|--------|------------|
| 1    | ≥ 85°F         | Topless       | Speedo | `#ec4899`  |
| 2    | 70–84°F        | T-Shirt       | Shorts | `#22c55e`  |
| 3    | 64–69°F        | Crew Neck     | Shorts | `#eab308`  |
| 4    | 58–63°F        | Light Jacket  | Shorts | `#f97316`  |
| 5    | 54–57°F        | Light Jacket  | Pants  | `#ea580c`  |
| 6    | 38–53°F        | Hoodie        | Pants  | `#ef4444`  |
| 7    | 30–37°F        | Medium Coat   | Pants  | `#3b82f6`  |
| 8    | < 30°F         | Winter Coat   | Pants  | `#8b5cf6`  |

Boundaries are checked with `>=` from top to bottom (first match wins). Tier 2 is `eff >= 70`, not `eff >= 70 && eff < 85`.

### Rain Override

After tier selection, if `data` is provided:
```
if precipProbability > 0.4 AND precipIntensity > 0.02:
  if bottom == "Shorts": bottom = "Pants"
```

This can push a warm-weather tier into pants regardless of temperature.

### `TIER_MAP` Constant (for UI display)

Array of 8 objects used by the TierMap UI component:

```
[
  { label: "Topless + Speedo",       range: "≥ 85°F",      min: 85,  max: Infinity, color: "#ec4899" },
  { label: "T-Shirt + Shorts",       range: "70 – 85°F",   min: 70,  max: 85,       color: "#22c55e" },
  { label: "Crew Neck + Shorts",     range: "64 – 70°F",   min: 64,  max: 70,       color: "#eab308" },
  { label: "Light Jacket + Shorts",  range: "58 – 64°F",   min: 58,  max: 64,       color: "#f97316" },
  { label: "Light Jacket + Pants",   range: "54 – 58°F",   min: 54,  max: 58,       color: "#ea580c" },
  { label: "Hoodie + Pants",         range: "38 – 54°F",   min: 38,  max: 54,       color: "#ef4444" },
  { label: "Medium Coat + Pants",    range: "30 – 38°F",   min: 30,  max: 38,       color: "#3b82f6" },
  { label: "Winter Coat + Pants",    range: "< 30°F",      min: -∞,  max: 30,       color: "#8b5cf6" },
]
```

---

## Accessory Tags

### `getAccessoryTags(data, clothing, dayHourlyData, personalAdj)` → array

Returns an array of `{ label, color }` objects. Up to 5 possible tags:

| Tag            | Condition                                                     | Color     |
|----------------|---------------------------------------------------------------|-----------|
| Windbreaker    | windSpeed > 15 AND top is NOT one of: Light Jacket, Hoodie, Medium Coat, Winter Coat | `#3b82f6` |
| Rain Jacket    | precipProbability > 0.3                                       | `#67e8f9` |
| Umbrella       | ANY hour in dayHourlyData has precipProbability > 0.5 (or current if no dayHourlyData) | `#60a5fa` |
| Sunscreen      | uvIndex ≥ 6                                                   | `#facc15` |
| Bring a Layer  | Day's max effective − min effective > 10°F (only if dayHourlyData has 2+ entries) | `#a78bfa` |

Tags are returned in the order listed above. Each tag is independent — multiple can be active simultaneously.

---

## Day Recommendation

### `getDayRecommendation(hourlyData, personalAdj, startHour)` → object | null

Scans hourly data to produce a single clothing recommendation that covers the whole day.

**Time window**: `startHour` (default 6, i.e. 6 AM) through 11 PM (23:00), using today's date.

**Algorithm**:
1. Filter hourly data to entries within the time window (inclusive)
2. Return null if no relevant hours
3. Find the hour with the lowest effective temperature (the "coldest hour")
4. Track `needsPants`: if any hour before 10 PM has effective temp < 58, set true
5. Get clothing tier from `getClothing(coldestEffective, coldestHour)`
6. If `needsPants` is true, override `bottom = "Pants"`
7. Compute accessory tags using the coldest hour's data and all relevant hours

**Return value**:
```
{
  coldestEffective: number,
  coldestHour: object,     // raw hourly data object for the coldest hour
  clothing: { top, bottom, color },
  tags: [{ label, color }]
}
```

**Pants override logic**: The `needsPants` check uses effective < 58 (the Light Jacket + Pants threshold) and only applies before 10 PM. This prevents a single cold late-night hour from overriding a warm day's shorts recommendation.
