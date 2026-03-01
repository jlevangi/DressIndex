# UI Components

Source files: `src/components/*.jsx`, `src/App.jsx`

---

## Component Hierarchy

```
ClothingAlgo (App.jsx)
├── WeatherSkeleton          (loading state)
├── OnboardingSurvey          (onboarding state)
├── ApiKeyEntry               (no-key state)
├── HeaderAction
├── LocationBar
├── ViewSwitcher
├── [PersonalAdj pill button] (inline in App.jsx)
├── LoadingSpinner + WeatherSkeleton  (fetching state)
│
├── [Today view]
│   ├── CurrentPanel
│   ├── SurveyCard
│   ├── DayAheadPanel
│   └── HourCard (×N)
│
├── [Tomorrow view]
│   ├── TomorrowSummaryPanel
│   └── HourCard (×N)
│
├── TierMapPanel
├── [PersonalAdj popup]      (inline modal in App.jsx)
│   └── PersonalAdjSlider
└── SettingsModal
    ├── PersonalAdjSlider
    └── NotifTimePicker
```

---

## Component Reference

### ApiKeyEntry

**Purpose**: Form for manual PirateWeather API key entry.

| Prop | Type | Description |
|------|------|-------------|
| `keyInput` | string | Current input value |
| `onKeyInputChange` | function | Input change handler |
| `onSaveKey` | function | Save/submit handler |

- Enter key triggers save
- Links to pirateweather.net for key generation

### CurrentPanel

**Purpose**: Displays current weather conditions with full modifier breakdown.

| Prop | Type | Description |
|------|------|-------------|
| `data` | object | Current weather data (`weatherData.currently`) |
| `personalAdj` | number | Personal temperature adjustment |

- Shows base temp, effective temp, apparent temp
- Renders all 6 modifier contributions with color-coded backgrounds
- Displays clothing tier recommendation with tier color
- Shows accessory tags as colored chips
- Condition labels: sky, wind, dew point, humidity, precip, UV

### DayAheadPanel

**Purpose**: Rest-of-day advisory comparing current conditions to the coldest upcoming hour.

| Prop | Type | Description |
|------|------|-------------|
| `hourlySlice` | array | Today's 9AM–8PM hourly data |
| `personalAdj` | number | Personal adjustment |
| `sunsetTime` | number | Sunset Unix timestamp (seconds) |
| `currentData` | object | Current weather data |

- Only renders if future hours exist through 9 PM
- "Bring warmer layers" alert if coldest future < current effective
- Up to 3 time slots: Coldest, Warmest, At Sunset — sorted chronologically
- Accessory tags computed from coldest hour

### HeaderAction

**Purpose**: Contextual action button in the app header (install / notifications / settings).

| Prop | Type | Description |
|------|------|-------------|
| `canInstall` | boolean | PWA installable |
| `isInstalled` | boolean | Already installed |
| `showIOSGuide` | boolean | Show iOS install modal |
| `onDismissIOSGuide` | function | Close iOS modal |
| `notifPermission` | string | `"granted"` / `"denied"` / `"default"` |
| `notifTime` | string | `"HH:MM"` or null |
| `notifEnabled` | boolean | Notifications enabled |
| `onInstall` | function | Install handler |
| `onRequestNotifications` | function | Request permission |
| `onOpenSettings` | function | Open settings |

**State priority** (first matching state wins):
1. Not installed + installable → Install button
2. Installed + no permission → Request notifications button
3. Permission granted + disabled → "Notifications off" (clickable → settings)
4. Permission granted + enabled + time set → Show time (clickable → settings)
5. Permission granted + enabled + no time → "Set time" (clickable → settings)

### HourCard

**Purpose**: Single hour in the scrollable timeline.

| Prop | Type | Description |
|------|------|-------------|
| `data` | object | Hourly weather data |
| `personalAdj` | number | Personal adjustment |
| `isNow` | boolean | Highlight as current hour |

- **Responsive breakpoint**: Switches from row to column layout at `max-width: 520px`
- Past hours dimmed to `opacity: 0.4`
- "NOW" badge: positioned absolute, `top: -8, left: 10`
- Conditions shown: sky, wind, dew point, precip (joined with `·`)
- Accessory tags rendered as small chips (max 3 per row on desktop)

### LoadingSpinner

**Purpose**: Animated loading indicator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | `"Loading..."` | Display text |

- Spinning ring: 0.8s linear rotation, orange top border
- Pulsing text: 1.4s ease-in-out opacity animation

### LocationBar

**Purpose**: Location display and dropdown selector.

| Prop | Type | Description |
|------|------|-------------|
| `locationName` | string | Current location display name |
| `locationSource` | string | `"gps"` or other |
| `locating` | boolean | GPS in progress |
| `lat` | number | Current latitude |
| `lng` | number | Current longitude |
| `homeLocation` | object | `{ name, lat, lng }` |
| `lastFetch` | Date | Last weather fetch time |
| `loading` | boolean | Weather fetch in progress |
| `savedLocations` | array | `[{ label, name, lat, lng }]` |
| `onRefresh` | function | Refresh weather |
| `onSettings` | function | Open settings |
| `onGeolocate` | function | Request GPS |
| `onSelectHomeLocation` | function | Select home |
| `onSelectLocation` | function | Select saved/preset |
| `onSelectTemporaryLocation` | function | Use once |
| `onSaveCustomLocation` | function | Save + use |
| `onRemoveSavedLocation` | function | Remove/hide location |

**Dropdown behavior**:
- Opens on location name click, closes on outside click
- Min-width: 260px, z-index: 200
- Contains: Home button, GPS button, saved locations with delete buttons, search input
- Search: min 2 chars, Nominatim geocoding, results as "use once" or "save" options
- Coordinate matching: `lat` and `lng` compared within 0.0001 tolerance
- GPS button animates spin while `locating`

### NotifTimePicker

**Purpose**: Time input for notification scheduling.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialTime` | string | `"07:00"` | Default time value |
| `onSave` | function | — | Save callback with time string |
| `onCancel` | function | — | Cancel callback (optional) |

- HTML5 `<input type="time">`
- Cancel button only renders if `onCancel` is provided

### OnboardingSurvey

**Purpose**: First-time user calibration survey. See [03-onboarding](03-onboarding.md) for full specification.

| Prop | Type | Description |
|------|------|-------------|
| `onComplete` | function | Called with `(totalAdj, homeChoice, defaultPref)` |

**Step state machine**: 0 → 1 → 2 → 3 → 4 → HOME_STEP → RESULT_STEP

Key UI details:
- Step dots: active dot is 24px wide + orange, inactive dots are 4px wide
- Answer buttons auto-advance to next step
- Home step: city search + GPS + "Use Home as default" toggle + Skip
- Result step: large orange number (48px font) + "Get Started" button
- Max width: 400px container

### PersonalAdjSlider

**Purpose**: Range input for personal temperature adjustment.

| Prop | Type | Description |
|------|------|-------------|
| `value` | number | Current value (-10 to +10) |
| `onChange` | function | Value change callback |

- Range: -10 to +10, step 1
- Labels: "I run cold" (left) / "I run hot" (right)
- Display: `{value}°F` with `+` prefix for positive values

### SettingsModal

**Purpose**: Full settings overlay. See section order below.

| Prop | Type | Description |
|------|------|-------------|
| `homeLocation` | object | `{ name, lat, lng }` |
| `defaultLocPref` | string | `"home"` or `"gps"` |
| `onSave` | function | Save home location |
| `onSaveDefaultLocPref` | function | Save default location pref |
| `onCancel` | function | Close modal |
| `personalAdj` | number | Current value |
| `onPersonalAdjChange` | function | Slider change callback |
| `notifPermission` | string | Permission state |
| `notifTime` | string | Notification time |
| `notifEnabled` | boolean | Enabled state |
| `onRequestNotifications` | function | Request permission |
| `onSaveNotifTime` | function | Save time |
| `onSetNotifEnabled` | function | Toggle enable |
| `onRedoOnboarding` | function | Reset onboarding (optional) |
| `themePref` | string | Current theme |
| `onThemeChange` | function | Theme change callback (optional) |

**Section order** (conditionally rendered):
1. **Appearance** — 3 toggle buttons: Light / Dark / Auto
2. **Comfort Calibration** — PersonalAdjSlider
3. **Notifications** — permission-dependent UI:
   - Denied: informational message
   - Default: "Enable" button
   - Granted: On/Off toggle + time picker + edit button
4. **Home Location** — search + GPS + coordinate display + default pref toggle
5. **Redo Onboarding** — "Redo Onboarding" button

Modal: fixed overlay, z-index 1000, max-width 380px, click-outside closes.

### SurveyCard

**Purpose**: Post-onboarding comfort survey card. See [04-comfort-survey](04-comfort-survey.md) for full specification.

| Prop | Type | Description |
|------|------|-------------|
| `surveyState` | string | Current state (see state machine) |
| `recommendedClothingTier` | string | Current clothing tier label |
| `onRespond` | function | Quick survey response |
| `onStartExtend` | function | Start extended survey |
| `onExtendRespond` | function | Extended survey submit |
| `onAcceptAdjust` | function | Accept suggestion |
| `onDismiss` | function | Dismiss card |
| `adjustDirection` | number | Suggested adjustment (+2 or -2) |

**State rendering**:
- `"ask"`: 3 buttons — Underdressed (blue), Spot On (green), Overdressed (orange)
- `"suggest-*"`: Direction + Apply/Dismiss
- `"ask-extend"`: "Sure!" / "Not now"
- `"extend-questions"`: 4-question form with chip selectors
- `"extend-thanks"`: Green checkmark, auto-dismisses after 2000ms

### TierMapPanel

**Purpose**: Visual reference of all 8 clothing tiers with current tier highlighted.

| Prop | Type | Description |
|------|------|-------------|
| `currentData` | object | Current weather data |
| `personalAdj` | number | Personal adjustment |

- Reads `TIER_MAP` from constants
- Computes effective temp to determine active tier
- Active tier: `background: {color}10`, `borderLeft: 2px solid {color}`
- Inactive tiers: `color: var(--text-disabled)`, transparent border

### TomorrowSummaryPanel

**Purpose**: Tomorrow's outfit recommendation with time slot breakdown.

| Prop | Type | Description |
|------|------|-------------|
| `hourlySlice` | array | Tomorrow's 9AM–8PM hourly data |
| `personalAdj` | number | Personal adjustment |
| `sunsetTime` | number | Tomorrow's sunset Unix timestamp |

- Returns null with "not yet available" message if `hourlySlice` is empty
- Computes coldest/warmest/sunset slots
- Highlighted outfit box for coldest point recommendation
- 3 slots sorted chronologically: Coldest, Warmest, At Sunset
- Accessory tags from coldest hour + all hours

### ViewSwitcher

**Purpose**: Today/Tomorrow toggle.

| Prop | Type | Description |
|------|------|-------------|
| `view` | string | `"today"` or `"tomorrow"` |
| `onViewChange` | function | Tab change callback |

- 2 buttons: "Today", "Tomorrow"
- Active: orange text, 2px orange bottom border
- Inactive: faint text, transparent border
- Flex layout: each button takes `flex: 1`

### WeatherSkeleton

**Purpose**: Placeholder skeleton during loading.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | `"Loading..."` | Pulsing text overlay |

- Shimmer animation: `translateX(-100% to 100%)` over 1.5s
- Skeleton elements: 1 header bar (40px), 6 pills (78×26px), 1 panel (160px), 5 cards (102×108px)
- Uses `var(--shimmer)` for gradient overlay

---

## Responsive Design

The only explicit responsive breakpoint is in **HourCard**:

```
@media (max-width: 520px) → column layout
```

All other components use flexible layouts (flex, max-width constraints) that adapt naturally.

Global max content width: **640px** (set on the container div in `App.jsx`).
