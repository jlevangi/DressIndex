import { computeEffective, getClothing, getAccessoryTags } from "../weather-utils.js";
import { getSkyLabel, getPrecipLabel } from "../utils.js";

export default function CurrentPanel({ data, personalAdj }) {
  const calc = computeEffective(data, personalAdj);
  const clothing = getClothing(calc.effective);
  const tags = getAccessoryTags(data, clothing, null, personalAdj);
  const modEntries = [
    { label: "Wind", val: calc.mods.wind },
    { label: "Sky", val: calc.mods.sky },
    { label: "Precip", val: calc.mods.precip },
    { label: "UV", val: calc.mods.uv },
    { label: "Dew Pt", val: calc.mods.dewPt },
    { label: "Personal", val: calc.mods.personal },
  ];

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
            Right Now
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "var(--text-heading)" }}>{Math.round(data.temperature)}&deg;F</span>
            <span style={{ fontSize: 14, color: "var(--text-faint)" }}>feels {Math.round(data.apparentTemperature || data.temperature)}&deg;</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-label)", marginTop: 4 }}>
            {getSkyLabel(data.cloudCover)} &middot; Wind {Math.round(data.windSpeed)} mph &middot; DP {Math.round(data.dewPoint)}&deg; &middot; Humidity {Math.round((data.humidity || 0) * 100)}%
            {data.precipIntensity > 0.01 && ` \u00b7 ${getPrecipLabel(data.precipIntensity)}`}
            {(data.uvIndex != null) && ` \u00b7 UV ${Math.round(data.uvIndex)}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 4 }}>EFFECTIVE</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f97316" }}>{calc.effective.toFixed(1)}&deg;F</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{
          background: "rgba(249,115,22,0.1)", border: "1px solid #f97316", borderRadius: 4,
          padding: "3px 8px", fontSize: 11, color: "var(--text-secondary)",
        }}>
          <span style={{ color: "var(--text-label)" }}>Base </span>{Math.round(data.temperature)}
        </span>
        {modEntries.map((m) => (
          <span key={m.label} style={{
            background: m.val === 0 ? "rgba(255,255,255,0.02)" : "rgba(249,115,22,0.06)",
            border: `1px solid ${m.val === 0 ? "var(--border)" : "#f9731630"}`,
            borderRadius: 4, padding: "3px 8px", fontSize: 11,
            color: m.val === 0 ? "var(--text-disabled)" : "var(--text-muted)",
          }}>
            <span style={{ color: "var(--text-faint)" }}>{m.label} </span>
            {m.val > 0 ? "+" : m.val < 0 ? "\u2212" : ""}{Math.abs(m.val)}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Top</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: clothing.color }}>{clothing.top}</div>
        </div>
        <div style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Bottom</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: clothing.color }}>{clothing.bottom}</div>
        </div>
      </div>
      {tags.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <span key={tag.label} style={{
              background: `${tag.color}15`, border: `1px solid ${tag.color}40`,
              borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 600,
              color: tag.color,
            }}>
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
