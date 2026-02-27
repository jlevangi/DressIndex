import { computeEffective } from "../weather-utils.js";
import { TIER_MAP } from "../constants.js";

export default function TierMapPanel({ currentData, personalAdj }) {
  const eff = computeEffective(currentData, personalAdj).effective;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 24px" }}>
      <div style={{ fontSize: 10, color: "var(--text-disabled)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Tier Map</div>
      {TIER_MAP.map((tier) => {
        const isActive = eff >= tier.min && eff < tier.max;
        return (
          <div key={tier.label} style={{
            display: "flex", justifyContent: "space-between", padding: "4px 8px",
            fontSize: 11, color: isActive ? tier.color : "var(--text-disabled)",
            background: isActive ? `${tier.color}10` : "transparent",
            borderRadius: 3, marginBottom: 2,
            borderLeft: isActive ? `2px solid ${tier.color}` : "2px solid transparent",
          }}>
            <span>{tier.label}</span>
            <span>{tier.range}</span>
          </div>
        );
      })}
    </div>
  );
}
