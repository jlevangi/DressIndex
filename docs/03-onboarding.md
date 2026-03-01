# Onboarding Survey

Source files: `src/components/OnboardingSurvey.jsx`, `src/constants.js`, `src/App.jsx`

---

## Overview

First-time users complete a 5-question survey to calibrate their personal temperature adjustment, optionally set a home location, then see their profile result. The survey is skipped if the user has previously completed it.

---

## Skip Detection

On app mount, the following check determines whether to show onboarding:

1. Read `onboardingComplete` from IndexedDB
2. If `true` → skip, load persisted `personalAdj`
3. If falsy → check `localStorage.getItem("dressindex_home")`
   - If exists → mark `onboardingComplete = true` in IndexedDB, skip
   - If not → show onboarding

This handles legacy users who set a home location before the onboarding system existed.

---

## Survey Questions

All questions are defined in the `ONBOARDING_QUESTIONS` array in `src/constants.js`.

### Question 1: "How does your body handle temperatures?"

| Answer | Points |
|--------|--------|
| Always cold | -2 |
| Average | 0 |
| Run hot | +2 |

### Question 2: "Typical outdoor activity level?"

| Answer | Points |
|--------|--------|
| Standing / sitting | -1 |
| Light walking | 0 |
| Active (running, hiking) | +1 |

### Question 3: "What kind of climate do you live in?"

| Answer | Points |
|--------|--------|
| Cold winters (Northeast, Midwest) | -1 |
| Four seasons, mild winters (Mid-Atlantic, Pacific NW) | 0 |
| Warm year-round (Florida, Gulf Coast, SoCal) | +1 |

### Question 4: "It's 70°F and breezy with some clouds — what are you reaching for?"

| Answer | Points |
|--------|--------|
| Definitely a jacket | -3 |
| A long sleeve or light layer | 0 |
| Still a t-shirt | +2 |

### Question 5: "When the temperature drops to the 50s, what's your move?"

| Answer | Points |
|--------|--------|
| I'm freezing, bundle me up | -2 |
| Chilly — I need real layers | -1 |
| A bit cool, light layer works | 0 |
| Barely notice it | +2 |
| Still in shorts and loving it | +3 |

---

## Personal Adjustment Calculation

```
personalAdj = sum of all selected answer points
```

**Theoretical range**: -9 to +9 (based on the most extreme answer for each question)

The value is clamped to -10 to +10 at the point of use (slider and survey adjustment).

---

## Flow Steps

The survey progresses through `QUESTION_COUNT + 2` steps (7 total):

| Step | Content |
|------|---------|
| 0–4 | One question per step (from ONBOARDING_QUESTIONS) |
| 5 (HOME_STEP) | Optional home location setup |
| 6 (RESULT_STEP) | Profile summary and completion |

### Step Indicator

A row of dots at the top, one per step. Active dot is wider (24px) and orange. Inactive dots are 4px wide. The dots animate width transitions.

### Navigation

- **Back button**: Visible on steps 1+. Goes to previous step.
- **Answer selection**: Tapping an answer auto-advances to the next step.

### Home Location Step (Step 5)

- **City search**: Text input with Nominatim geocoding (see [06-location](06-location.md))
- **Use GPS**: Button to request browser geolocation
- **"Use Home as default" toggle**: Sets `defaultLocationPref` to "home" or "gps"
- **Skip**: Proceeds without setting home

### Result Step (Step 6)

- Displays the computed `personalAdj` as a large orange number (e.g., "+3°F")
- Descriptive text explaining what the number means
- "Get Started" button triggers completion

---

## On Completion

When the user taps "Get Started" on the result step:

1. Calls `onComplete(totalAdj, homeChoice, defaultPref)` prop
2. The parent (`App.jsx`) then:
   - Sets `personalAdj` state
   - Saves home location if provided (`handleSaveHome`)
   - Saves default location preference (`handleSaveDefaultLocPref`)
   - Sets `onboardingDone = true`

### Persistence Written by OnboardingSurvey

Written directly inside the OnboardingSurvey component on completion:

| Storage | Key | Value |
|---------|-----|-------|
| IndexedDB | `onboardingComplete` | `true` |
| IndexedDB | `personalAdj` | number (-9 to +9) |
| IndexedDB | `onboardingAnswers` | `{ q1, q2, q3, q4, q5 }` — selected answer labels |
| IndexedDB | `defaultLocationPref` | `"home"` or `"gps"` |
| IndexedDB | `onboardingTs` | `Date.now()` timestamp |

Written by parent on completion:

| Storage | Key | Value |
|---------|-----|-------|
| localStorage | `dressindex_home` | JSON: `{ name, lat, lng }` (if home was set) |
