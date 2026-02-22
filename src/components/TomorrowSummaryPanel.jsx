import { computeEffective, getClothing } from "../weather-utils.js";
import { formatHour } from "../utils.js";

export default function TomorrowSummaryPanel({ hourlySlice, personalAdj, sunsetTime }) {
  if (!hourlySlice.length) return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Tomorrow
      </div>
      <div style={{ fontSize: 12, color: "#555" }}>
        Hourly data for tomorrow is not yet available. Check back later.
      </div>
    </div>
  );

  const calcs = hourlySlice.map((h) => ({
    data: h,
    calc: computeEffective(h, personalAdj, sunsetTime),
  }));

  const coldest = calcs.reduce((min, cur) =>
    cur.calc.effective < min.calc.effective ? cur : min
  );
  const warmest = calcs.reduce((max, cur) =>
    cur.calc.effective > max.calc.effective ? cur : max
  );

  const sunsetEntry = sunsetTime ? calcs.reduce((closest, cur) =>
    Math.abs(cur.data.time - sunsetTime) < Math.abs(closest.data.time - sunsetTime) ? cur : closest
  ) : null;

  const coldestClothing = getClothing(coldest.calc.effective);

  return (
    <div style={{
      background: "#111", border: "1px solid #1a1a1a",
      borderRadius: 8, padding: 24, marginBottom: 20,
    }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Tomorrow
      </div>

      <div style={{
        background: "rgba(249,115,22,0.08)", border: "1px solid #f9731630",
        borderRadius: 6, padding: "12px 16px", marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, color: "#f97316", fontWeight: 600, marginBottom: 4 }}>
          Recommended Outfit
        </div>
        <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5 }}>
          At its coldest ({formatHour(coldest.data.time)}), it'll feel like{" "}
          <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{coldest.calc.effective.toFixed(0)}&deg;F</span>
          {" "}&mdash; bring a{" "}
          <span style={{ color: coldestClothing.color, fontWeight: 600 }}>{coldestClothing.top}</span>
          {" "}and{" "}
          <span style={{ color: coldestClothing.color, fontWeight: 600 }}>{coldestClothing.bottom}</span>.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {(() => {
          const slots = [
            { label: "Coldest", entry: coldest, clothing: coldestClothing },
            { label: "Warmest", entry: warmest, clothing: getClothing(warmest.calc.effective) },
          ];
          if (sunsetEntry) {
            slots.push({ label: "At Sunset", entry: sunsetEntry, clothing: getClothing(sunsetEntry.calc.effective) });
          }
          slots.sort((a, b) => a.entry.data.time - b.entry.data.time);
          return slots.map((slot) => (
            <div key={slot.label} style={{ flex: 1, background: "#0a0a0a", borderRadius: 6, padding: 12, border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                {slot.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: slot.clothing.color }}>
                  {slot.entry.calc.effective.toFixed(0)}&deg;
                </span>
                <span style={{ fontSize: 11, color: "#555" }}>eff</span>
              </div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                {formatHour(slot.entry.data.time)} &middot; {slot.clothing.top}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
