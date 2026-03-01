# Notification System

Source files: `src/hooks/useNotifications.js`, `src/sw.js`

---

## Overview

DressIndex uses a three-layer notification system to deliver a daily clothing recommendation at the user's chosen time. The layers provide increasing reliability: background sync (most reliable, Chromium-only), in-app timer (fallback), and missed-notification recovery (catch-all).

---

## Notification Content

All three layers produce the same notification:

**Title**: "DressIndex"

**Body format** (when recommendation available):
```
{coldestEffective}°F coldest effective today — wear a {top} + {bottom} | {tag1}, {tag2}, ...
```

**Body fallback** (no data):
```
Open DressIndex to see today's recommendation
```

**Tag**: `daily-clothing` (deduplication — only one active notification with this tag)

**Icon**: `/icons/icon-192.png`

---

## Layer 1: Periodic Background Sync (Service Worker)

**Most reliable layer.** Works even when the app is closed. Chromium-only (Chrome, Edge).

### Registration

Registered when:
- User saves a notification time (`handleSaveNotifTime`)
- On app mount if notifications are already granted and enabled

```
periodicSync.register("daily-clothing-check", { minInterval: 60 * 60 * 1000 })
```

The browser may invoke this more or less frequently than the `minInterval`.

### Handler (`sw.js`)

On `periodicsync` event with tag `daily-clothing-check`:

1. Read all config from IndexedDB: `notifTime`, `notifEnabled`, `apiKey`, `lat`, `lng`, `personalAdj`, `lastNotifDate`
2. **Guard checks**:
   - Exit if `notifTime` or `apiKey` is missing, or `notifEnabled === false`
   - Exit if `lastNotifDate === today` (YYYY-MM-DD format) — already fired
   - Compute minutes since target time: `nowMinutes - targetMinutes`
   - Exit if before target time (`diff < 0`) or more than 4 hours past (`diff > 240`)
3. Fetch weather from PirateWeather API
4. Run `getDayRecommendation(hourlyData, personalAdj, targetHour)`
5. Show notification
6. Write `lastNotifDate = todayStr` to IndexedDB

---

## Layer 2: setTimeout Fallback (In-App)

**Works in any browser** but only while the app tab is open.

### Setup

Runs as a React `useEffect` whenever `notifPermission`, `notifTime`, or `notifEnabled` changes:

1. Exit if permission is not `"granted"`, no time set, or disabled
2. Parse target time (HH:MM)
3. If target time has passed today, schedule for tomorrow
4. `setTimeout(fireClothingNotification, delay)`

### `fireClothingNotification()`

1. Uses already-loaded `weatherData` from React state (no API call)
2. Runs `getDayRecommendation(hourlyData, personalAdj, startHour)` where startHour is from `notifTime`
3. If service worker controller exists: sends `SHOW_NOTIFICATION` message to SW
4. Otherwise: creates `new Notification()` directly

---

## Layer 3: Missed Notification Check (On Mount)

**Catch-all** for when periodic sync didn't fire and the app was closed at the target time.

On app mount, if notifications are granted, time is set, and enabled:

```
serviceWorker.controller.postMessage({ type: "CHECK_MISSED_NOTIFICATION" })
```

The SW runs `checkAndFireNotification()` (same function as Layer 1), which checks `lastNotifDate` to avoid duplicates.

---

## Config Sync (App → Service Worker)

The app pushes config to the SW via `postMessage` whenever relevant values change:

```
Message type: "SYNC_CONFIG"
Payload: { notifTime, notifEnabled, apiKey, lat, lng, personalAdj }
```

The SW iterates over the config object and writes each key-value pair to IndexedDB using `setConfig()`.

This runs as a `useEffect` watching: `notifTime`, `notifEnabled`, `apiKey`, `lat`, `lng`, `personalAdj`.

---

## SW Message Types

| Message Type | Direction | Handler |
|---|---|---|
| `SYNC_CONFIG` | App → SW | Writes config to IndexedDB |
| `SHOW_NOTIFICATION` | App → SW | Shows notification with provided title/body |
| `CHECK_MISSED_NOTIFICATION` | App → SW | Runs `checkAndFireNotification()` |

---

## Permission & Enable Flow

### Initial Grant

1. User taps notification button in `HeaderAction`
2. `Notification.requestPermission()` is called
3. If granted: `notifEnabled = true`, `showTimePicker = true`
4. Settings modal opens automatically (via `useEffect` watching `showTimePicker`)
5. User sets time → `handleSaveNotifTime(time)`:
   - Saves to localStorage
   - Registers periodic sync
   - Fires test notification immediately

### Enable/Disable Toggle

In Settings modal, a toggle switches `notifEnabled`:
- Saved to localStorage as `"true"` or `"false"`
- Synced to SW via `SYNC_CONFIG`

---

## Notification Click

When user taps a notification:
1. Notification closes
2. SW searches for existing app window
3. If found: focuses it
4. If not: opens new window at `/`

---

## Deduplication

`lastNotifDate` (YYYY-MM-DD string in IndexedDB) prevents multiple notifications per day. Set after successful notification in Layer 1/3. Layer 2 relies on the `daily-clothing` notification tag for dedup.
