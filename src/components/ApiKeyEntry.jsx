export default function ApiKeyEntry({ keyInput, onKeyInputChange, onSaveKey }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: 24 }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        PirateWeather API Key
      </div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
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
            flex: 1, padding: "8px 12px", background: "#0a0a0a", border: "1px solid #333",
            borderRadius: 4, color: "#e0e0e0", fontFamily: "inherit", fontSize: 13, outline: "none",
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
