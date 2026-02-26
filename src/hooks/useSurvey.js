import { useState, useEffect, useCallback } from "react";
import { getConfig, setConfig } from "../idb-config.js";
import { computeEffective, getClothing } from "../weather-utils.js";
import { logEvent } from "../firebase.js";

const DAY_MS = 86400000;

export default function useSurvey({ weatherLoaded, currentData, personalAdj }) {
  const [surveyState, setSurveyState] = useState(null); // null | "ask" | "thanks" | "suggest-lower" | "suggest-raise" | "dialed-in"
  const [adjustDirection, setAdjustDirection] = useState(0); // -2 or +2
  const [dismissed, setDismissed] = useState(false);

  const devAlwaysShow = import.meta.env.DEV && import.meta.env.VITE_SURVEY_DEBUG === "true";

  // Determine whether to show the survey (runs once when weather loads)
  useEffect(() => {
    if (!weatherLoaded || dismissed) return;

    // Dev override: skip all suppression checks
    if (devAlwaysShow) {
      setSurveyState("ask");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [onboardingTs, lastSurveyTs, adjHistory] = await Promise.all([
          getConfig("onboardingTs"),
          getConfig("lastSurveyTs"),
          getConfig("adjHistory"),
        ]);

        if (cancelled) return;

        const now = Date.now();

        // Suppress during first 3 days after onboarding
        if (onboardingTs && now - onboardingTs < 3 * DAY_MS) return;

        // Suppress if already surveyed today
        if (lastSurveyTs) {
          const lastDate = new Date(lastSurveyTs).toDateString();
          const todayDate = new Date(now).toDateString();
          if (lastDate === todayDate) return;
        }

        // Primary trigger: 2+ adjHistory entries within last 7 days
        const recentAdj = (adjHistory || []).filter(
          (e) => now - e.ts < 7 * DAY_MS
        );
        if (recentAdj.length >= 2) {
          setSurveyState("ask");
          return;
        }

        // Secondary trigger: 14+ days since last survey or onboarding
        const lastActivity = lastSurveyTs || onboardingTs || 0;
        if (lastActivity && now - lastActivity >= 14 * DAY_MS) {
          setSurveyState("ask");
          return;
        }
      } catch (_) {
        // IDB failed — don't show survey
      }
    })();

    return () => { cancelled = true; };
  }, [weatherLoaded, dismissed, devAlwaysShow]);

  const onRespond = useCallback(async (response) => {
    // response: "over" | "right" | "under"
    const now = Date.now();

    // Build survey entry
    let effectiveTemp = null;
    let actualTemp = null;
    let clothingTier = null;
    if (currentData) {
      effectiveTemp = computeEffective(currentData, personalAdj);
      actualTemp = currentData.temperature || null;
      clothingTier = getClothing(effectiveTemp).top;
    }

    try {
      const history = (await getConfig("surveyHistory")) || [];
      history.push({ response, ts: now, personalAdj, effectiveTemp, actualTemp, clothingTier });
      await setConfig("surveyHistory", history.slice(-50));
      await setConfig("lastSurveyTs", now);
      logEvent("surveys", { response, personalAdj, effectiveTemp, actualTemp, clothingTier });

      // Check last 3 responses for pattern
      const last3 = history.slice(-3);
      if (last3.length >= 3) {
        const overCount = last3.filter((e) => e.response === "over").length;
        const underCount = last3.filter((e) => e.response === "under").length;
        const rightCount = last3.filter((e) => e.response === "right").length;

        if (overCount >= 2) {
          setAdjustDirection(-2);
          setSurveyState("suggest-lower");
          return;
        }
        if (underCount >= 2) {
          setAdjustDirection(2);
          setSurveyState("suggest-raise");
          return;
        }
        if (rightCount >= 2) {
          // Suppress surveys for 30 days by pushing lastSurveyTs far forward
          await setConfig("lastSurveyTs", now + 30 * DAY_MS);
          setSurveyState("dialed-in");
          return;
        }
      }

      // Mixed — show thanks confirmation
      setSurveyState("thanks");
    } catch (_) {
      setSurveyState("thanks");
    }
  }, [currentData, personalAdj]);

  const onAcceptAdjust = useCallback(() => {
    setSurveyState(null);
    setDismissed(true);
  }, []);

  const onDismiss = useCallback(() => {
    setSurveyState(null);
    setDismissed(true);
  }, []);

  return {
    showSurvey: surveyState !== null && !dismissed,
    surveyState,
    onRespond,
    onAcceptAdjust,
    onDismiss,
    adjustDirection,
  };
}
