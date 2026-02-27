export default function ApiKeyEntry({ keyInput, onKeyInputChange, onSaveKey }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 24 }}>
      <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        PirateWeather API Key
      </div>
      <div style={{ fontSize: 12, color: "var(--text-label)", marginBottom: 16, lineHeight: 1.5 }}>
        Get a free key at{" "}
        <a href="https://pirateweather.net" target="_blank" rel="noreferrer" style={{ color: "#f97316" }}>
          pirateweather.net
        </a>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={keyInput}
          onChange={(e) => onKeyInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSaveKey()}
          placeholder="Paste API key"
          style={{
            flex: 1, padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-btn)",
            borderRadius: 4, color: "var(--text)", fontFamily: "inherit", fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={onSaveKey}
          style={{
            padding: "8px 16px", background: "#f97316", color: "#000", border: "none",
            borderRadius: 4, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Connect
        </button>
      </div>
    </div>
  );
}
