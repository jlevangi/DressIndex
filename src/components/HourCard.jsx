import { computeEffective, getClothing } from "../weather-utils.js";
import { getSkyLabel, getPrecipLabel, formatHour } from "../utils.js";

export default function HourCard({ data, personalAdj, isNow }) {
  const calc = computeEffective(data, personalAdj);
  const clothing = getClothing(calc.effective);
  const isPast = data.time * 1000 < Date.now() && !isNow;

  const conditions = [
    getSkyLabel(data.cloudCover),
    `Wind ${Math.round(data.windSpeed)}`,
    `DP ${Math.round(data.dewPoint)}°`,
    data.precipIntensity > 0.01 ? getPrecipLabel(data.precipIntensity) : null,
  ].filter(Boolean).join(" · ");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: isNow ? "#1a1a1a" : "#111",
      border: isNow ? "1px solid #f97316" : "1px solid #1a1a1a",
      borderRadius: 8,
      padding: "10px 14px",
      opacity: isPast ? 0.4 : 1,
      position: "relative",
    }}>
      {isNow && (
        <div style={{
          position: "absolute", top: -8, left: 10,
          background: "#f97316", color: "#000", fontSize: 9, fontWeight: 700,
          padding: "1px 6px", borderRadius: 3, letterSpacing: 1,
        }}>NOW</div>
      )}
      <div style={{ minWidth: 48, flexShrink: 0, fontSize: 12, fontWeight: 600, color: isNow ? "#f0f0f0" : "#888" }}>
        {formatHour(data.time)}
      </div>
      <div style={{ minWidth: 44, flexShrink: 0, fontSize: 20, fontWeight: 700, color: "#e0e0e0" }}>
        {Math.round(data.temperature)}&deg;
      </div>
      <div style={{ flex: 1, fontSize: 11, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {conditions}
      </div>
      <div style={{ flexShrink: 0, fontSize: 10, color: "#555", textAlign: "right" }}>
        EFF {calc.effective.toFixed(0)}&deg;F
      </div>
      <div style={{ minWidth: 80, flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: clothing.color }}>{clothing.top}</div>
        <div style={{ fontSize: 10, color: clothing.color, opacity: 0.7 }}>{clothing.bottom}</div>
      </div>
    </div>
  );
}
