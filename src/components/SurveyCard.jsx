import { useEffect } from "react";

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

export default function SurveyCard({ surveyState, onRespond, onAcceptAdjust, onDismiss, adjustDirection }) {
  // Auto-dismiss confirmation states after a delay
  useEffect(() => {
    if (surveyState !== "dialed-in" && surveyState !== "thanks") return;
    const t = setTimeout(onDismiss, surveyState === "dialed-in" ? 3000 : 2000);
    return () => clearTimeout(t);
  }, [surveyState, onDismiss]);

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
          How did today's recommendation feel?
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
            <div>{"\u2193"} Underdressed</div>
            <div style={{ fontSize: 10, fontWeight: 400, color: "var(--text-dim)", marginTop: 2 }}>Colder than expected</div>
          </button>
          <button
            onClick={() => onRespond("right")}
            style={{
              ...btnBase, flex: 1,
              background: "rgba(34,197,94,0.08)", color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.3)",
            }}
          >
            <div>{"\u2713"} Spot On</div>
          </button>
          <button
            onClick={() => onRespond("over")}
            style={{
              ...btnBase, flex: 1,
              background: "rgba(249,115,22,0.08)", color: "#f97316",
              border: "1px solid rgba(249,115,22,0.3)",
            }}
          >
            <div>{"\u2191"} Overdressed</div>
            <div style={{ fontSize: 10, fontWeight: 400, color: "var(--text-dim)", marginTop: 2 }}>Warmer than expected</div>
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

  if (surveyState === "thanks") {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>
          <span style={{ color: "#22c55e" }}>{"\u2713"}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
          Response recorded
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
          Thanks for the feedback!
        </div>
      </div>
    );
  }

  if (surveyState === "dialed-in") {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>
          <span style={{ color: "#22c55e" }}>{"\u2713"}</span>
        </div>
        <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>
          You're dialed in!
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
          We'll check back in a month.
        </div>
      </div>
    );
  }

  return null;
}
