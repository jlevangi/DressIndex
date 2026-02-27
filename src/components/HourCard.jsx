import { useEffect, useState } from "react";
import { computeEffective, getClothing } from "../weather-utils.js";
import { getSkyLabel, getPrecipLabel, formatHour } from "../utils.js";

export default function HourCard({ data, personalAdj, isNow }) {
  const calc = computeEffective(data, personalAdj);
  const clothing = getClothing(calc.effective);
  const isPast = data.time * 1000 < Date.now() && !isNow;
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 520px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 520px)");
    const onChange = (e) => setIsMobile(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const conditions = [
    getSkyLabel(data.cloudCover),
    `Wind ${Math.round(data.windSpeed)}`,
    `DP ${Math.round(data.dewPoint)}°`,
    data.precipIntensity > 0.01 ? getPrecipLabel(data.precipIntensity) : null,
  ].filter(Boolean).join(" · ");

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      gap: isMobile ? 6 : 16,
      background: isNow ? "var(--bg-secondary)" : "var(--bg-card)",
      border: isNow ? "1px solid #f97316" : "1px solid var(--border)",
      borderRadius: 8,
      padding: "10px 14px",
      opacity: isPast ? 0.4 : 1,
      position: "relative",
    }}>
      {isNow && (
        <div style={{
          position: "absolute",
          top: -8,
          left: 10,
          background: "#f97316",
          color: "#000",
          fontSize: 9,
          fontWeight: 700,
          padding: "1px 6px",
          borderRadius: 3,
          letterSpacing: 1,
        }}>
          NOW
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
        <div style={{ minWidth: 48, flexShrink: 0, fontSize: 12, fontWeight: 600, color: isNow ? "var(--text-heading)" : "var(--text-dim)" }}>
          {formatHour(data.time)}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
          <div style={{ minWidth: 44, flexShrink: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
            {Math.round(data.temperature)}&deg;
          </div>
          <div style={{ flexShrink: 0, fontSize: 12, color: "var(--text-faint)" }}>
            {calc.effective.toFixed(0)}&deg; eff.
          </div>
        </div>

        {!isMobile && (
          <div style={{ flex: 1, fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {conditions}
          </div>
        )}

        <div style={{ minWidth: 80, flexShrink: 0, textAlign: "right", marginLeft: "auto", display: "flex", flexDirection: "column", justifyContent: "center", alignSelf: "stretch" }}>
          <div style={{ fontSize: isMobile ? 13 : 11, fontWeight: 600, color: clothing.color }}>{clothing.top}</div>
          <div style={{ fontSize: isMobile ? 12 : 10, color: clothing.color, opacity: 0.7 }}>{clothing.bottom}</div>
        </div>
      </div>

      {isMobile && (
        <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.35 }}>
          {conditions}
        </div>
      )}
    </div>
  );
}
