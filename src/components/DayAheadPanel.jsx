import { computeEffective, getClothing, getAccessoryTags } from "../weather-utils.js";
import { formatHour } from "../utils.js";

export default function DayAheadPanel({ hourlySlice, personalAdj, sunsetTime, currentData }) {
  const now = Math.floor(Date.now() / 1000);
  const endOf9pm = new Date();
  endOf9pm.setHours(21, 0, 0, 0);
  const end9pmTs = Math.floor(endOf9pm.getTime() / 1000);
  const futureHours = hourlySlice.filter((h) => h.time > now && h.time <= end9pmTs);
  if (!futureHours.length || !currentData) return null;

  const futureCalcs = futureHours.map((h) => ({
    data: h,
    calc: computeEffective(h, personalAdj),
  }));

  const coldest = futureCalcs.reduce((min, cur) =>
    cur.calc.effective < min.calc.effective ? cur : min
  );
  const warmest = futureCalcs.reduce((max, cur) =>
    cur.calc.effective > max.calc.effective ? cur : max
  );

  const sunsetEntry = sunsetTime ? futureCalcs.reduce((closest, cur) =>
    Math.abs(cur.data.time - sunsetTime) < Math.abs(closest.data.time - sunsetTime) ? cur : closest
  ) : null;

  const currentCalc = computeEffective(currentData, personalAdj);
  const currentClothing = getClothing(currentCalc.effective);
  const coldestClothing = getClothing(coldest.calc.effective);

  const needsWarmer = coldest.calc.effective < currentCalc.effective &&
    (coldestClothing.top !== currentClothing.top || coldestClothing.bottom !== currentClothing.bottom);

  // Accessory tags for rest of day (uses coldest hour data + all future hours for "Bring a Layer")
  const tags = getAccessoryTags(coldest.data, coldestClothing, futureHours.map((h) => h), personalAdj);

  return (
    <div style={{
      background: "#111", border: `1px solid ${needsWarmer ? "#f9731640" : "#1a1a1a"}`,
      borderRadius: 8, padding: 24, marginBottom: 20,
    }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Rest of Day
      </div>

      {needsWarmer ? (
        <div style={{
          background: "rgba(249,115,22,0.08)", border: "1px solid #f9731630",
          borderRadius: 6, padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: "#f97316", fontWeight: 600, marginBottom: 4 }}>
            Bring warmer layers
          </div>
          <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5 }}>
            By {formatHour(coldest.data.time)} it'll feel like{" "}
            <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{coldest.calc.effective.toFixed(0)}&deg;F</span>
            {" "}&mdash; you'll want a{" "}
            <span style={{ color: coldestClothing.color, fontWeight: 600 }}>{coldestClothing.top}</span>
            {coldestClothing.bottom !== currentClothing.bottom && (
              <> and <span style={{ color: coldestClothing.color, fontWeight: 600 }}>{coldestClothing.bottom}</span></>
            )}.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
          Conditions stay similar &mdash; what you're wearing now should work all day.
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: tags.length > 0 ? 16 : 0 }}>
        {(() => {
          const slots = [
            { label: "Tonight", entry: coldest, clothing: coldestClothing },
            { label: "Warmest Point", entry: warmest, clothing: getClothing(warmest.calc.effective) },
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

      {tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
