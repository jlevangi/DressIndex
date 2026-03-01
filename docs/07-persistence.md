# Storage Schema

Source files: `src/idb-config.js`, all hooks, `src/App.jsx`, `src/sw.js`

---

## IndexedDB

**Database name**: `dressindex`
**Store name**: `config`
**Version**: 1

The store uses an out-of-line key (keys are passed explicitly to `put()`/`get()`). No indexes.

### Keys

| Key | Type | Default | Written By | Read By | Description |
|-----|------|---------|------------|---------|-------------|
| `onboardingComplete` | boolean | — | OnboardingSurvey, App.jsx | App.jsx | Whether onboarding has been completed |
| `personalAdj` | number | 0 | App.jsx (debounced), SW (via SYNC_CONFIG) | App.jsx, SW | Personal temperature adjustment (-10 to +10) |
| `onboardingAnswers` | object | — | OnboardingSurvey | — | `{ q1, q2, q3, q4, q5 }` answer labels |
| `onboardingTs` | number | — | OnboardingSurvey | useSurvey | `Date.now()` when onboarding completed |
| `defaultLocationPref` | string | `"gps"` | App.jsx, OnboardingSurvey | App.jsx | `"home"` or `"gps"` |
| `adjHistory` | array | `[]` | App.jsx | useSurvey | Last 30 entries: `[{ value, ts }]` |
| `surveyHistory` | array | `[]` | useSurvey | useSurvey | Last 50 entries: `[{ response, personalAdj, effectiveTemp, actualTemp, clothingTier, ts }]` |
| `lastSurveyTs` | number | — | useSurvey | useSurvey | `Date.now()` of last comfort survey |
| `theme` | string | — | useTheme | — | `"light"`, `"dark"`, or `"auto"` (secondary write; localStorage is primary) |
| `notifTime` | string | — | SW (via SYNC_CONFIG) | SW | `"HH:MM"` notification time |
| `notifEnabled` | boolean | — | SW (via SYNC_CONFIG) | SW | Whether notifications are enabled |
| `apiKey` | string | — | SW (via SYNC_CONFIG) | SW | PirateWeather API key |
| `lat` | number | — | SW (via SYNC_CONFIG) | SW | Current latitude |
| `lng` | number | — | SW (via SYNC_CONFIG) | SW | Current longitude |
| `lastNotifDate` | string | — | SW | SW | `"YYYY-MM-DD"` last notification date (dedup) |

### API

```
getConfig(key)      → Promise<any>           // single key read
setConfig(key, val) → Promise<void>          // single key write
getAllConfig()       → Promise<{key: value}>  // read all keys as object
```

All functions open a new database connection per call (no persistent handle).

---

## localStorage

All keys are prefixed with `dressindex_`.

| Key | Type | Default | Written By | Read By | Description |
|-----|------|---------|------------|---------|-------------|
| `dressindex_home` | JSON string | — | useLocation | useLocation | `{ name, lat, lng }` home location |
| `dressindex_theme` | string | `"auto"` | useTheme | useTheme, anti-flash script | `"light"`, `"dark"`, or `"auto"` |
| `dressindex_notif_time` | string | `null` | useNotifications | useNotifications | `"HH:MM"` notification time |
| `dressindex_notif_enabled` | string | `"true"` | useNotifications | useNotifications | `"true"` or `"false"` |
| `dressindex_saved_locations` | JSON string | `"[]"` | useLocation | useLocation | Array of saved location objects |
| `dressindex_hidden_preset_locations` | JSON string | `"[]"` | useLocation | useLocation | Array of hidden preset coordinate keys |

---

## Dual-Write Patterns

Some values are written to both localStorage and IndexedDB for different consumers:

### Theme
- **localStorage**: Primary store, read synchronously by anti-flash script and useTheme
- **IndexedDB**: Secondary write via `setConfig("theme", pref)`, not currently read (future-proofing)

### Notification Config
- **localStorage**: Primary store for the app (useNotifications reads on mount)
- **IndexedDB**: Written by SW via `SYNC_CONFIG` message, read by SW for background notifications
- Flow: App writes to localStorage → App sends SYNC_CONFIG to SW → SW writes to IndexedDB

### Personal Adjustment
- **IndexedDB only**: Written with 500ms debounce after slider changes
- Also tracked in `adjHistory` (last 30 entries) for comfort survey pattern detection

---

## Debounce

The `personalAdj` write to IndexedDB is debounced at **500ms**. Each slider change resets the timer. On write, it also appends to `adjHistory` if the value actually changed.

---

## Data Limits

| Collection | Max Entries | Trim Strategy |
|------------|-------------|---------------|
| `adjHistory` | 30 | `.slice(-30)` on write |
| `surveyHistory` | 50 | `.slice(-50)` on write |
| `dressindex_saved_locations` | 10 | Dedup + limit on save |
