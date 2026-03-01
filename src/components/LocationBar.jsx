import { useState, useRef, useEffect } from "react";
import { searchCity } from "../geocode.js";

function isMatchingCoords(currentLat, currentLng, loc) {
  const locLat = Number(loc?.lat);
  const locLng = Number(loc?.lng);
  if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) return false;
  if (!Number.isFinite(locLat) || !Number.isFinite(locLng)) return false;
  return Math.abs(currentLat - locLat) < 0.0001 && Math.abs(currentLng - locLng) < 0.0001;
}

export default function LocationBar({
  locationName,
  locationSource,
  lat,
  lng,
  homeLocation,
  lastFetch,
  loading,
  savedLocations,
  onRefresh,
  onSettings,
  onGeolocate,
  onSelectHomeLocation,
  onSelectLocation,
  onSelectTemporaryLocation,
  onSaveCustomLocation,
  onRemoveSavedLocation,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [customResults, setCustomResults] = useState([]);
  const [customError, setCustomError] = useState("");
  const [customSearching, setCustomSearching] = useState(false);
  const dropdownRef = useRef(null);

  const resetCustomSearch = () => {
    setCustomOpen(false);
    setCustomQuery("");
    setCustomResults([]);
    setCustomError("");
    setCustomSearching(false);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
    resetCustomSearch();
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleCustomSearch = async () => {
    setCustomError("");
    setCustomResults([]);

    const query = customQuery.trim();
    if (query.length < 2) {
      setCustomError("Enter at least 2 characters.");
      return;
    }

    setCustomSearching(true);
    const results = await searchCity(query);
    setCustomSearching(false);
    setCustomResults(results);
    if (!results.length) {
      setCustomError("No results found.");
    }
  };

  const handleUseCustom = (loc) => {
    onSelectTemporaryLocation?.(loc);
    closeDropdown();
  };

  const handleSaveCustom = (loc) => {
    onSaveCustomLocation?.(loc);
    closeDropdown();
  };

  const isLocationActive = (loc) => {
    if (isMatchingCoords(lat, lng, loc)) return true;
    return locationName === loc.name;
  };

  const availableSavedLocations = Array.isArray(savedLocations) ? savedLocations : [];
  const homeName = homeLocation?.name || "Not set";
  const isHomeActive = isLocationActive(homeLocation);
  const isGpsActive = locationSource === "gps";

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 16, padding: "16px 12px", background: "var(--bg-card)", borderRadius: 6,
      border: "1px solid var(--border)",
    }}>
      {/* Clickable location name with dropdown */}
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => {
            if (dropdownOpen) {
              closeDropdown();
              return;
            }
            setDropdownOpen(true);
          }}
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
            minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,0.8)", overflow: "hidden",
          }}>
            {/* Current Location (GPS) */}
            <button
              onClick={() => { onGeolocate(); closeDropdown(); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 11, fontFamily: "inherit",
                background: isGpsActive ? "rgba(249,115,22,0.12)" : "transparent",
                color: isGpsActive ? "#f97316" : "var(--text-muted)",
                border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span style={{ fontWeight: isGpsActive ? 700 : 500 }}>Current Location</span>
            </button>

            {/* Home */}
            <button
              onClick={() => {
                onSelectHomeLocation?.();
                closeDropdown();
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 11, fontFamily: "inherit",
                background: !isGpsActive && isHomeActive ? "rgba(249,115,22,0.12)" : "transparent",
                color: !isGpsActive && isHomeActive ? "#f97316" : "var(--text-muted)",
                border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span style={{ fontWeight: !isGpsActive && isHomeActive ? 700 : 500 }}>Home</span>
              <span style={{ color: "var(--text-disabled)", fontSize: 10, marginLeft: "auto" }}>{homeName}</span>
            </button>

            {/* Saved / preset locations */}
            {availableSavedLocations.map((loc, i) => {
              const isActive = !isGpsActive && isLocationActive(loc);
              const isLast = i === availableSavedLocations.length - 1;
              return (
                <div
                  key={`saved:${loc.lat}:${loc.lng}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <button
                    onClick={() => { onSelectLocation(loc); closeDropdown(); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", textAlign: "left",
                      padding: "9px 8px 9px 14px", fontSize: 11, fontFamily: "inherit",
                      background: isActive ? "rgba(249,115,22,0.12)" : "transparent",
                      color: isActive ? "#f97316" : "var(--text-muted)",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    <span style={{ fontWeight: isActive ? 700 : 500 }}>{loc.label}</span>
                    <span style={{ color: "var(--text-disabled)", fontSize: 10 }}>{loc.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSavedLocation?.(loc);
                    }}
                    title="Remove saved location"
                    style={{
                      border: "none",
                      borderLeft: "1px solid var(--border)",
                      alignSelf: "stretch",
                      width: 32,
                      background: "transparent",
                      color: "var(--text-faint)",
                      cursor: "pointer",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    x
                  </button>
                </div>
              );
            })}

            {/* Search for a location */}
            <button
              onClick={() => {
                setCustomOpen((open) => !open);
                setCustomError("");
                setCustomResults([]);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 11, fontFamily: "inherit",
                background: customOpen ? "rgba(249,115,22,0.12)" : "transparent",
                color: customOpen ? "#f97316" : "var(--text-muted)",
                border: "none", cursor: "pointer",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ fontWeight: 600 }}>Search for a location</span>
              <svg style={{ marginLeft: "auto" }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={customOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
              </svg>
            </button>

            {customOpen && (
              <div style={{
                padding: 10,
                background: "var(--bg-page)",
              }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSearch()}
                    placeholder="Search city"
                    style={{
                      flex: 1, padding: "7px 8px", background: "var(--bg-input)", border: "1px solid var(--border-btn)",
                      borderRadius: 4, color: "var(--text)", fontFamily: "inherit", fontSize: 11, outline: "none",
                    }}
                  />
                  <button
                    onClick={handleCustomSearch}
                    disabled={customSearching}
                    style={{
                      background: "transparent", border: "1px solid var(--border-btn)", borderRadius: 4,
                      color: customSearching ? "var(--text-disabled)" : "var(--text-secondary)",
                      fontFamily: "inherit", fontSize: 10, padding: "7px 10px",
                      cursor: customSearching ? "default" : "pointer",
                    }}
                  >
                    {customSearching ? "..." : "Search"}
                  </button>
                </div>

                {customResults.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {customResults.map((result) => (
                      <div
                        key={`${result.name}:${result.lat}:${result.lng}`}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          background: "var(--bg-card)",
                          padding: 8,
                        }}
                      >
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 7 }}>
                          {result.name}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleUseCustom(result)}
                            style={{
                              flex: 1,
                              border: "1px solid var(--border-btn)",
                              borderRadius: 4,
                              background: "transparent",
                              color: "var(--text-dim)",
                              fontFamily: "inherit",
                              fontSize: 10,
                              padding: "5px 6px",
                              cursor: "pointer",
                            }}
                          >
                            Use once
                          </button>
                          <button
                            onClick={() => handleSaveCustom(result)}
                            style={{
                              flex: 1,
                              border: "1px solid #f97316",
                              borderRadius: 4,
                              background: "rgba(249,115,22,0.12)",
                              color: "#f97316",
                              fontFamily: "inherit",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "5px 6px",
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {customError && (
                  <div style={{ fontSize: 10, color: "#ef4444", marginTop: 8 }}>{customError}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {lastFetch && (
          <span style={{ fontSize: 12, color: "var(--text-disabled)" }}>
            {lastFetch.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: "transparent", border: "1px solid var(--border-btn)", borderRadius: 4,
            color: loading ? "var(--text-disabled)" : "var(--text-dim)", fontSize: 12, padding: "6px 12px",
            cursor: loading ? "default" : "pointer", fontFamily: "inherit",
          }}
        >
          {loading ? "..." : "Refresh"}
        </button>
        <button
          onClick={onSettings}
          style={{
            background: "transparent", border: "1px solid var(--border-btn)", borderRadius: 4,
            color: "var(--text-label)", fontSize: 12, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center",
          }}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
