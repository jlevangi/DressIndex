# Comfort Survey System

Source files: `src/hooks/useSurvey.js`, `src/components/SurveyCard.jsx`

---

## Overview

After onboarding, a recurring comfort survey asks users "How do you feel right now?" to detect calibration drift and suggest adjustment changes. The survey has two phases: a quick comfort check and an optional extended survey.

---

## Trigger Conditions

The survey is evaluated once when weather data first loads. All checks are async (IndexedDB reads).

### Suppression Rules (checked in order)

1. **Already dismissed this session**: If user dismissed the card, don't re-show
2. **Dev override**: If `VITE_SURVEY_DEBUG=true` in dev mode, skip all suppression — always show
3. **First day after onboarding**: If `Date.now() - onboardingTs < 86400000` (1 day in ms), suppress
4. **Already surveyed today**: If `lastSurveyTs` is today (same `toDateString()`), suppress

### Trigger Rules (if not suppressed)

5. **Primary trigger**: 1+ entries in `adjHistory` within the last 7 days → show survey
6. **Secondary trigger**: 5+ days since the later of `lastSurveyTs` or `onboardingTs` → show survey

If no trigger fires, the survey stays hidden.

---

## State Machine

```
null ──────── "ask"
                │
                ├──[over/under with pattern] ──→ "suggest-lower" or "suggest-raise"
                │                                       │
                │                                       ├──[accept] ──→ null (dismissed)
                │                                       └──[dismiss] ──→ null (dismissed)
                │
                └──[any response, no pattern] ──→ "ask-extend"
                                                       │
                                                       ├──[start extend] ──→ "extend-questions"
                                                       │                          │
                                                       │                          └──[submit] ──→ "extend-thanks"
                                                       │                                              │
                                                       │                                              └──[2s auto] ──→ null
                                                       └──[dismiss] ──→ null (dismissed)
```

### States

| State | UI | User Actions |
|-------|----|--------------|
| `null` | Hidden | — |
| `"ask"` | "How do you feel right now?" with 3 buttons | Underdressed / Spot On / Overdressed |
| `"suggest-lower"` | "We suggest lowering your calibration by 2°F" | Apply / Dismiss |
| `"suggest-raise"` | "We suggest raising your calibration by 2°F" | Apply / Dismiss |
| `"ask-extend"` | "Want to share more details?" | Sure! / Not now |
| `"extend-questions"` | 4-question extended form | Submit (all required) |
| `"extend-thanks"` | Green checkmark, "Thanks!" | Auto-dismisses after 2000ms |

---

## Quick Survey Response Handling

When user responds to the "ask" state with "over", "right", or "under":

1. Capture context: current effective temp, actual temp, clothing tier, personalAdj
2. Append to `surveyHistory` in IndexedDB (kept to last 50 entries)
3. Set `lastSurveyTs` in IndexedDB to `Date.now()`
4. Log event to Firebase (`surveys` collection)

### Pattern Detection

After recording the response, check the last 3 entries in `surveyHistory`:

- If 2+ of last 3 are `"over"` → set state to `"suggest-lower"`, adjustDirection = -2
- If 2+ of last 3 are `"under"` → set state to `"suggest-raise"`, adjustDirection = +2
- Otherwise → set state to `"ask-extend"`

### Accepting a Suggestion

When user taps "Apply" on a suggestion:
```
newPersonalAdj = clamp(personalAdj + adjustDirection, -10, +10)
```
This triggers the normal personalAdj persistence flow (debounced IndexedDB write + adjHistory tracking).

---

## Extended Survey Questions

The extended survey collects 4 data points, all required before submission:

### 1. "What are you wearing?"
Multi-select chips:
- T-shirt, Tank top, Long sleeve, Sweater, Light jacket, Heavy coat, Shorts, Pants, Dress/Skirt

### 2. "Does our recommendation match your outfit?"
Single select:
- Lighter than suggested, Matched, Warmer than suggested

### 3. "Did you add or remove any layers?"
Single select:
- No changes, Added layers, Removed layers, Both

### 4. "What's driving your comfort right now?"
Single select:
- Temp swing, Wind, Humidity, Sun/shade, Indoors/AC, Activity level

### On Submit

All answers are logged to Firebase (`extendedSurveys` collection) along with the comfort context from the quick survey. State transitions to `"extend-thanks"`.

---

## Dev Override

Set `VITE_SURVEY_DEBUG=true` in `.env` to always show the survey in development mode, bypassing all suppression rules. Only works when `import.meta.env.DEV` is true.
