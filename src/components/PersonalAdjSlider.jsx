export default function PersonalAdjSlider({ value, onChange }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
      padding: "16px 24px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Comfort Calibration</span>
        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
          {value > 0 ? `+${value}` : value}&deg;F
        </span>
      </div>
      <input
        type="range" min={-10} max={10} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#f97316" }}
      />
      <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2, textAlign: "center" }}>
        &larr; I run cold&nbsp;&nbsp;|&nbsp;&nbsp;I run hot &rarr;
      </div>
    </div>
  );
}
