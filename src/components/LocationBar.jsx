import { useState, useRef, useEffect } from "react";

export default function LocationBar({ locationName, lastFetch, loading, locations, onRefresh, onReset, onSettings, onGeolocate, onSelectLocation }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 16, padding: "8px 12px", background: "var(--bg-card)", borderRadius: 6,
      border: "1px solid var(--border)",
    }}>
      {/* Clickable location name with dropdown */}
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            background: "transparent", border: "none", padding: "2px 4px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
            {locationName || "\u2014"}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={dropdownOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
        </button>

        {dropdownOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
            background: "var(--bg-card)", border: "1px solid var(--bg-hover)", borderRadius: 8,
            minWidth: 210, boxShadow: "0 8px 32px rgba(0,0,0,0.8)", overflow: "hidden",
          }}>
            <button
              onClick={() => { onGeolocate(); setDropdownOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 11, fontFamily: "inherit",
                background: locationName === "Current Location" ? "rgba(249,115,22,0.12)" : "transparent",
                color: locationName === "Current Location" ? "#f97316" : "var(--text-muted)",
                border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              Current Location
            </button>
            {locations.map((loc, i) => {
              const isActive = locationName === loc.name;
              const isLast = i === locations.length - 1;
              return (
                <button
                  key={loc.label}
                  onClick={() => { onSelectLocation(loc); setDropdownOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", textAlign: "left",
                    padding: "9px 14px", fontSize: 11, fontFamily: "inherit",
                    background: isActive ? "rgba(249,115,22,0.12)" : "transparent",
                    color: isActive ? "#f97316" : "var(--text-muted)",
                    border: "none", borderBottom: isLast ? "none" : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: isActive ? 700 : 400 }}>{loc.label}</span>
                  <span style={{ color: "var(--text-disabled)", fontSize: 10 }}>{loc.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {lastFetch && (
          <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>
            {lastFetch.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: "transparent", border: "1px solid var(--border-btn)", borderRadius: 3,
            color: loading ? "var(--text-disabled)" : "var(--text-dim)", fontSize: 10, padding: "2px 8px",
            cursor: loading ? "default" : "pointer", fontFamily: "inherit",
          }}
        >
          {loading ? "..." : "Refresh"}
        </button>
        <button
          onClick={onSettings}
          style={{
            background: "transparent", border: "1px solid var(--border-btn)", borderRadius: 3,
            color: "var(--text-label)", fontSize: 10, padding: "3px 5px", cursor: "pointer", fontFamily: "inherit",
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
  );
}
