import { useEffect, useMemo, useState } from "react";

const CLOTHING_CHOICES = [
  { label: "T-Shirt", value: "t-shirt" },
  { label: "Long Sleeve", value: "long-sleeve" },
  { label: "Hoodie/Sweater", value: "hoodie-sweater" },
  { label: "Jacket", value: "jacket" },
  { label: "Shorts", value: "shorts" },
  { label: "Pants", value: "pants" },
];

const OUTFIT_MATCH_CHOICES = [
  { label: "Lighter than suggested", value: "lighter" },
  { label: "About what was suggested", value: "matched" },
  { label: "Warmer than suggested", value: "warmer" },
];

const LAYER_CHANGE_CHOICES = [
  { label: "No change", value: "none" },
  { label: "Added layers later", value: "added-layer" },
  { label: "Removed layers later", value: "removed-layer" },
  { label: "Added and removed layers", value: "both" },
];

const COMFORT_DRIVER_CHOICES = [
  { label: "Temperature swing", value: "temp-swing" },
  { label: "Wind", value: "wind" },
  { label: "Humidity", value: "humidity" },
  { label: "Sun / shade", value: "sun-shade" },
  { label: "Indoors / A/C", value: "indoors-ac" },
  { label: "Activity level", value: "activity" },
];

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 16,
  marginBottom: 20,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
};

const btnBase = {
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 600,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  padding: "10px 14px",
  transition: "all 0.15s ease",
};

export default function SurveyCard({
  surveyState,
  recommendedClothingTier,
  onRespond,
  onStartExtend,
  onExtendRespond,
  onAcceptAdjust,
  onDismiss,
  adjustDirection,
}) {
  const [clothing, setClothing] = useState([]);
  const [recommendationMatch, setRecommendationMatch] = useState(null);
  const [layerChange, setLayerChange] = useState(null);
  const [comfortDriver, setComfortDriver] = useState(null);

  // Auto-dismiss confirmation states after a delay
  useEffect(() => {
    if (surveyState !== "extend-thanks") return;
    const t = setTimeout(onDismiss, 2000);
    return () => clearTimeout(t);
  }, [surveyState, onDismiss]);

  useEffect(() => {
    if (surveyState !== "extend-questions") return;
    setClothing([]);
    setRecommendationMatch(null);
    setLayerChange(null);
    setComfortDriver(null);
  }, [surveyState]);

  const canSubmitExtended = useMemo(
    () => clothing.length > 0 && recommendationMatch && layerChange && comfortDriver,
    [clothing, recommendationMatch, layerChange, comfortDriver]
  );

  const toggleClothing = (value) => {
    setClothing((prev) => (
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    ));
  };

  const chipStyle = (selected) => ({
    ...btnBase,
    background: selected ? "rgba(249,115,22,0.18)" : "transparent",
    color: selected ? "#f97316" : "var(--text)",
    border: selected ? "1px solid rgba(249,115,22,0.5)" : "1px solid var(--border-btn)",
    padding: "8px 10px",
    fontSize: 11,
  });

  if (surveyState === "ask") {
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 2, textTransform: "uppercase" }}>
            Comfort Check
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: "transparent", border: "none", color: "var(--text-faint)",
              fontSize: 16, cursor: "pointer", padding: "0 4px", lineHeight: 1,
            }}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 14 }}>
          How comfortable were you in today's recommendation?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onRespond("under")}
            style={{
              ...btnBase, flex: 1,
              background: "rgba(96,165,250,0.08)", color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.3)",
            }}
          >
            <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>🥶</div>
            <div>Underdressed</div>
          </button>
          <button
            onClick={() => onRespond("right")}
            style={{
              ...btnBase, flex: 1,
              background: "rgba(34,197,94,0.08)", color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.3)",
            }}
          >
            <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>👍</div>
            <div>Spot On</div>
          </button>
          <button
            onClick={() => onRespond("over")}
            style={{
              ...btnBase, flex: 1,
              background: "rgba(249,115,22,0.08)", color: "#f97316",
              border: "1px solid rgba(249,115,22,0.3)",
            }}
          >
            <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>🥵</div>
            <div>Overdressed</div>
          </button>
        </div>
      </div>
    );
  }

  if (surveyState === "suggest-lower" || surveyState === "suggest-raise") {
    const direction = adjustDirection > 0 ? "raise" : "lower";
    const arrow = adjustDirection > 0 ? "+" : "";
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          Calibration Suggestion
        </div>
        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 14, lineHeight: 1.5 }}>
          Based on your recent feedback, we suggest {direction === "raise" ? "raising" : "lowering"} your
          calibration by {Math.abs(adjustDirection)}&deg;F.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onAcceptAdjust}
            style={{
              ...btnBase, flex: 1,
              background: "#f97316", color: "#000",
            }}
          >
            Apply {arrow}{adjustDirection}&deg;F
          </button>
          <button
            onClick={onDismiss}
            style={{
              ...btnBase, flex: 1,
              background: "transparent", color: "var(--text-dim)",
              border: "1px solid var(--border-btn)",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (surveyState === "ask-extend") {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          Quick Follow-up
        </div>
        <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600, marginBottom: 8 }}>
          Help improve DressIndex!
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
          Would you answer four quick questions to improve our recommendations?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onStartExtend}
            style={{
              ...btnBase,
              flex: 1,
              background: "#f97316",
              color: "#000",
            }}
          >
            Sure!
          </button>
          <button
            onClick={onDismiss}
            style={{
              ...btnBase,
              flex: 1,
              background: "transparent",
              color: "var(--text-dim)",
              border: "1px solid var(--border-btn)",
            }}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (surveyState === "extend-questions") {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          Extended Survey
        </div>

        <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 8 }}>What did you end up wearing most of today?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {CLOTHING_CHOICES.map((choice) => (
            <button
              key={choice.value}
              onClick={() => toggleClothing(choice.value)}
              style={chipStyle(clothing.includes(choice.value))}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 8 }}>Compared to the DressIndex suggestion, your final outfit was:</div>
        {recommendedClothingTier && (
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>
            Suggested top: {recommendedClothingTier}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {OUTFIT_MATCH_CHOICES.map((choice) => (
            <button
              key={choice.value}
              onClick={() => setRecommendationMatch(choice.value)}
              style={chipStyle(recommendationMatch === choice.value)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 8 }}>Did you change layers after leaving home?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {LAYER_CHANGE_CHOICES.map((choice) => (
            <button
              key={choice.value}
              onClick={() => setLayerChange(choice.value)}
              style={chipStyle(layerChange === choice.value)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 8 }}>What most affected your comfort today?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {COMFORT_DRIVER_CHOICES.map((choice) => (
            <button
              key={choice.value}
              onClick={() => setComfortDriver(choice.value)}
              style={chipStyle(comfortDriver === choice.value)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onExtendRespond({ clothing, recommendationMatch, layerChange, comfortDriver })}
            disabled={!canSubmitExtended}
            style={{
              ...btnBase,
              flex: 1,
              background: canSubmitExtended ? "#f97316" : "rgba(249,115,22,0.35)",
              color: "#000",
              cursor: canSubmitExtended ? "pointer" : "not-allowed",
            }}
          >
            Submit
          </button>
          <button
            onClick={onDismiss}
            style={{
              ...btnBase,
              background: "transparent",
              color: "var(--text-dim)",
              border: "1px solid var(--border-btn)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (surveyState === "extend-thanks") {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>
          <span style={{ color: "#22c55e" }}>{"\u2713"}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
          Extended response recorded
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
          Thanks for the feedback!
        </div>
      </div>
    );
  }

  return null;
}
