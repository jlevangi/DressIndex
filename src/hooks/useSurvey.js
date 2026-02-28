import { useState, useEffect, useCallback } from "react";
import { getConfig, setConfig } from "../idb-config.js";
import { computeEffective, getClothing } from "../weather-utils.js";
import { logEvent } from "../firebase.js";

const DAY_MS = 86400000;

export default function useSurvey({ weatherLoaded, currentData, personalAdj }) {
  const [surveyState, setSurveyState] = useState(null); // null | "ask" | "ask-extend" | "extend-questions" | "extend-thanks" | "suggest-lower" | "suggest-raise"
  const [adjustDirection, setAdjustDirection] = useState(0); // -2 or +2
  const [dismissed, setDismissed] = useState(false);
  const [lastComfortContext, setLastComfortContext] = useState(null);

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

        // Suppress during first day after onboarding
        if (onboardingTs && now - onboardingTs < DAY_MS) return;

        // Suppress if already surveyed today
        if (lastSurveyTs) {
          const lastDate = new Date(lastSurveyTs).toDateString();
          const todayDate = new Date(now).toDateString();
          if (lastDate === todayDate) return;
        }

        // Primary trigger: 1+ adjHistory entries within last 7 days
        const recentAdj = (adjHistory || []).filter(
          (e) => now - e.ts < 7 * DAY_MS
        );
        if (recentAdj.length >= 1) {
          setSurveyState("ask");
          return;
        }

        // Secondary trigger: 5+ days since last survey or onboarding
        const lastActivity = lastSurveyTs || onboardingTs || 0;
        if (lastActivity && now - lastActivity >= 5 * DAY_MS) {
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

    const context = { response, personalAdj, effectiveTemp, actualTemp, clothingTier };
    setLastComfortContext(context);

    let history = [];
    try {
      history = (await getConfig("surveyHistory")) || [];
    } catch (_) {
      history = [];
    }

    const updatedHistory = [...history, { ...context, ts: now }];

    try {
      await setConfig("surveyHistory", updatedHistory.slice(-50));
      await setConfig("lastSurveyTs", now);
    } catch (_) {
      // IDB failures should not block survey flow
    }

    logEvent("surveys", context);

    // Check last 3 responses for pattern
    const last3 = updatedHistory.slice(-3);
    if (last3.length >= 3) {
      const overCount = last3.filter((e) => e.response === "over").length;
      const underCount = last3.filter((e) => e.response === "under").length;

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
    }

    setSurveyState("ask-extend");
  }, [currentData, personalAdj]);

  const onStartExtend = useCallback(() => {
    setSurveyState("extend-questions");
  }, []);

  const onExtendRespond = useCallback(async ({ clothing, recommendationMatch, layerChange, comfortDriver }) => {
    const context = lastComfortContext || {
      response: null,
      effectiveTemp: null,
      actualTemp: null,
      clothingTier: null,
      personalAdj,
    };

    await logEvent("extendedSurveys", {
      clothing,
      recommendationMatch,
      layerChange,
      comfortDriver,
      comfortResponse: context.response,
      effectiveTemp: context.effectiveTemp,
      actualTemp: context.actualTemp,
      clothingTier: context.clothingTier,
      personalAdj: context.personalAdj,
    });

    setSurveyState("extend-thanks");
  }, [lastComfortContext, personalAdj]);

  const onAcceptAdjust = useCallback(() => {
    setSurveyState(null);
    setDismissed(true);
    setLastComfortContext(null);
  }, []);

  const onDismiss = useCallback(() => {
    setSurveyState(null);
    setDismissed(true);
    setLastComfortContext(null);
  }, []);

  return {
    showSurvey: surveyState !== null && !dismissed,
    surveyState,
    recommendedClothingTier: lastComfortContext?.clothingTier || null,
    onRespond,
    onStartExtend,
    onExtendRespond,
    onAcceptAdjust,
    onDismiss,
    adjustDirection,
  };
}
