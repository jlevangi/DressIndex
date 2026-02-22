export default function LocationBar({ locationName, lastFetch, loading, locations, onRefresh, onReset, onSettings, onGeolocate, onSelectLocation }) {
  return (
    <>
      {/* Status bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, padding: "8px 12px", background: "#111", borderRadius: 6,
        border: "1px solid #1a1a1a", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#666" }}>{locationName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastFetch && (
            <span style={{ fontSize: 10, color: "#444" }}>
              {lastFetch.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: "transparent", border: "1px solid #333", borderRadius: 3,
              color: loading ? "#333" : "#888", fontSize: 10, padding: "2px 8px",
              cursor: loading ? "default" : "pointer", fontFamily: "inherit",
            }}
          >
            {loading ? "..." : "Refresh"}
          </button>
          <button
            onClick={onReset}
            style={{
              background: "transparent", border: "1px solid #333", borderRadius: 3,
              color: "#555", fontSize: 10, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Reset
          </button>
          <button
            onClick={onSettings}
            style={{
              background: "transparent", border: "1px solid #333", borderRadius: 3,
              color: "#666", fontSize: 10, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center",
            }}
            title="Settings"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick location buttons */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap",
      }}>
        <button
          onClick={onGeolocate}
          style={{
            padding: "4px 12px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
            background: locationName === "Current Location" ? "#f97316" : "transparent",
            color: locationName === "Current Location" ? "#000" : "#666",
            border: locationName === "Current Location" ? "1px solid #f97316" : "1px solid #333",
            borderRadius: 4, cursor: "pointer",
          }}
        >
          Current Location
        </button>
        {locations.map((loc) => {
          const isActive = locationName === loc.name;
          return (
            <button
              key={loc.label}
              onClick={() => onSelectLocation(loc)}
              style={{
                padding: "4px 12px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
                background: isActive ? "#f97316" : "transparent",
                color: isActive ? "#000" : "#666",
                border: isActive ? "1px solid #f97316" : "1px solid #333",
                borderRadius: 4, cursor: "pointer",
              }}
            >
              {loc.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
