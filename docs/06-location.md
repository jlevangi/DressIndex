# Location Management

Source files: `src/hooks/useLocation.js`, `src/geocode.js`, `src/constants.js`

---

## Location Model

All locations use this shape:

```
{
  label: string,  // Short display name (e.g., "Disney", "Home")
  name: string,   // Full name (e.g., "Bay Lake, FL")
  lat: number,    // Latitude, 4 decimal places
  lng: number     // Longitude, 4 decimal places
}
```

If `label` is not provided, it defaults to the first comma-segment of `name`.

---

## Default & Preset Locations

### Default Home

```
{ name: "Davenport, FL", lat: 28.1614, lng: -81.6137 }
```

Used when no home location has been saved.

### Preset Locations (4)

| Label | Name | Lat | Lng |
|-------|------|-----|-----|
| Disney | Bay Lake, FL | 28.3922 | -81.5812 |
| Orlando | Orlando, FL | 28.5383 | -81.3792 |
| Miami | Miami, FL | 25.7617 | -80.1918 |
| Tampa | Tampa, FL | 27.9506 | -82.4572 |

Presets appear in the location dropdown unless hidden by the user.

---

## Location Source Tracking

The `locationSource` state tracks how the current location was set:
- `"gps"` — From browser geolocation
- `"named"` — From a named selection (home, preset, saved, search result)

This affects the UI — GPS locations show the pin icon, named locations do not.

---

## Initialization Logic

On mount, once `defaultLocationPref` is known (read from IndexedDB):

| Preference | Behavior |
|------------|----------|
| `"home"` | Immediately set lat/lng/name from `homeLocation` |
| `"gps"` (default) | Request browser geolocation. On success: use GPS coords. On failure: fall back to `homeLocation`. |

Geolocation options: `{ enableHighAccuracy: false, maximumAge: 300000 (5 min), timeout: 10000 (10s) }`

---

## GPS Request Handling

### Race Condition Prevention

A `geoRequestId` ref (incrementing integer) prevents stale GPS results from overwriting newer selections:

1. Before each GPS request: increment `geoRequestId`, capture current value as `requestId`
2. On GPS success callback: if `geoRequestId.current !== requestId`, discard result
3. When user selects a named location: also increments `geoRequestId` to invalidate in-flight GPS

### GPS Flow

1. Set `locating = true`, `locationName = "Locating..."`, `locationSource = "gps"`
2. Call `navigator.geolocation.getCurrentPosition()`
3. **On success**: round coords to 4 decimal places, reverse geocode for city name, set as current location
4. **On failure**: restore previous location name/source, show error message

---

## Coordinate Normalization

All coordinates are normalized to 4 decimal places:
```
roundedLat = Number(lat.toFixed(4))
roundedLng = Number(lng.toFixed(4))
```

### Dedup Key Format

Locations are deduplicated using a string key:
```
"${lat.toFixed(4)},${lng.toFixed(4)}"
```

Two locations with coordinates within 0.0001° of rounding are considered the same place.

---

## Geocoding

Uses [Nominatim](https://nominatim.openstreetmap.org/) (OpenStreetMap's free geocoding service).

### Forward Search (`searchCity`)

```
GET https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5&addressdetails=1
```

- Minimum query length: 2 characters
- Returns up to 5 results
- Each result is mapped to `{ name, lat, lng }` where name is formatted as "City, State" (or "City, Country" / "State, Country" fallback)

### Reverse Geocode (`reverseGeocode`)

```
GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&addressdetails=1
```

- Returns a formatted location label for GPS coordinates
- Used to display city name after GPS location is acquired
- Falls back to "Current Location" on failure

### Location Label Formatting

The geocoder formats names from the Nominatim `address` object:
```
Priority: city > town > village > hamlet > county
Format: "{city}, {state}" or "{city}, {country}" or "{state}, {country}"
Fallback: first two parts of display_name
```

---

## Saved Locations

### User Saved Locations

- Stored in localStorage key `dressindex_saved_locations`
- Maximum 10 locations
- New saves are prepended (most recent first)
- Deduplicated by coordinate key

### Hidden Preset Locations

- Stored in localStorage key `dressindex_hidden_preset_locations`
- Array of coordinate key strings (e.g., `["28.3922,-81.5812"]`)
- Removing a preset location hides it rather than deleting it from the presets array

### Dropdown Display Order

The location dropdown shows:
1. Home button (always present)
2. Current Location / GPS button
3. User saved locations (newest first)
4. Visible preset locations (presets not in hidden list)

### Location Actions

| Action | Function | Effect |
|--------|----------|--------|
| Select home | `selectHomeLocation()` | Sets current location to home |
| Select saved/preset | `selectLocation(loc)` | Sets current location |
| Use once (search result) | `selectTemporaryLocation(loc)` | Sets location without saving |
| Save custom | `saveCustomLocation(loc)` | Saves to list + sets as current |
| Remove saved | `removeSavedLocation(loc)` | Removes from user list (or hides preset) |
