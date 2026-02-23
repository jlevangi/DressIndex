import { computeEffective, getClothing } from "../weather-utils.js";
import { getSkyLabel, getPrecipLabel, formatHour } from "../utils.js";

export default function HourCard({ data, personalAdj, isNow }) {
  const calc = computeEffective(data, personalAdj);
  const clothing = getClothing(calc.effective);
  const isPast = data.time * 1000 < Date.now() && !isNow;

  return (
    <div style={{
      minWidth: 110,
      background: isNow ? "#1a1a1a" : "#111",
      border: isNow ? "1px solid #f97316" : "1px solid #1a1a1a",
      borderRadius: 8,
      padding: "12px 10px",
      opacity: isPast ? 0.4 : 1,
      position: "relative",
      flexShrink: 0,
    }}>
      {isNow && (
        <div style={{
          position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
          background: "#f97316", color: "#000", fontSize: 9, fontWeight: 700,
          padding: "1px 6px", borderRadius: 3, letterSpacing: 1,
        }}>NOW</div>
      )}
      <div style={{ fontSize: 12, color: isNow ? "#f0f0f0" : "#888", fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
        {formatHour(data.time)}
      </div>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#e0e0e0" }}>{Math.round(data.temperature)}&deg;</span>
      </div>
      <div style={{ fontSize: 10, color: "#555", textAlign: "center", marginBottom: 8, lineHeight: 1.4 }}>
        {getSkyLabel(data.cloudCover)}<br />
        Wind {Math.round(data.windSpeed)} mph<br />
        DP {Math.round(data.dewPoint)}&deg;
        {data.precipIntensity > 0.01 && <><br />{getPrecipLabel(data.precipIntensity)}</>}
      </div>
      <div style={{ borderTop: "1px solid #222", paddingTop: 8, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>EFF {calc.effective.toFixed(0)}&deg;F</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: clothing.color }}>{clothing.top}</div>
        <div style={{ fontSize: 11, color: clothing.color, opacity: 0.7 }}>{clothing.bottom}</div>
      </div>
    </div>
  );
}
