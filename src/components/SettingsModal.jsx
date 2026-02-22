import { useState } from "react";
import { searchCity, reverseGeocode } from "../geocode.js";
import NotifTimePicker from "./NotifTimePicker.jsx";
import { formatTime12h } from "../utils.js";

export default function SettingsModal({
  homeLocation, defaultLocPref, onSave, onSaveDefaultLocPref, onCancel,
  personalAdj, onPersonalAdjChange,
  notifPermission, notifTime, onRequestNotifications, onSaveNotifTime,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [selectedHome, setSelectedHome] = useState(homeLocation);
  const [selectedPref, setSelectedPref] = useState(defaultLocPref === "home" ? "home" : "gps");
  const [editingNotifTime, setEditingNotifTime] = useState(!notifTime && notifPermission === "granted");

  const handleSearch = async () => {
    setSearchError("");
    setSearchResults([]);
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError("Enter at least 2 characters.");
      return;
    }

    setSearching(true);
    const results = await searchCity(query);
    setSearching(false);
    setSearchResults(results);
    if (!results.length) {
      setSearchError("No results found.");
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation unavailable.");
      return;
    }
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(4);
        const lng = +pos.coords.longitude.toFixed(4);
        const name = (await reverseGeocode(lat, lng)) || "Current Location";
        setSelectedHome({ name, lat, lng });
      },
      () => setSearchError("Unable to read GPS location.")
    );
  };

  const handleSave = () => {
    onSave(selectedHome);
    onSaveDefaultLocPref(selectedPref);
  };

  const handleSaveNotif = (time) => {
    onSaveNotifTime(time);
    setEditingNotifTime(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
      overflowY: "auto",
    }} onClick={onCancel}>
      <div style={{
        background: "#111", border: "1px solid #333", borderRadius: 10, padding: 24,
        width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 24,
      }} onClick={(e) => e.stopPropagation()}>

        {/* ── Home Location ── */}
        <section>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 14, letterSpacing: 0.2 }}>
            Home Location
          </div>

          <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Search by City Name</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Orlando"
              style={{
                flex: 1, padding: "8px 10px", background: "#0a0a0a", border: "1px solid #333",
                borderRadius: 4, color: "#e0e0e0", fontFamily: "inherit", fontSize: 12, outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                background: "transparent", border: "1px solid #333", borderRadius: 4,
                color: searching ? "#444" : "#ccc", fontFamily: "inherit", fontSize: 11,
                padding: "8px 12px", cursor: searching ? "default" : "pointer",
              }}
            >
              {searching ? "..." : "Search"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {searchResults.map((result) => {
                const isSelected = selectedHome.lat === result.lat && selectedHome.lng === result.lng;
                return (
                  <button
                    key={`${result.name}:${result.lat}:${result.lng}`}
                    onClick={() => setSelectedHome(result)}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 10px",
                      fontSize: 12, fontFamily: "inherit",
                      background: isSelected ? "rgba(249,115,22,0.15)" : "#0a0a0a",
                      border: isSelected ? "1px solid #f97316" : "1px solid #333",
                      borderRadius: 6, color: isSelected ? "#f97316" : "#ccc", cursor: "pointer",
                    }}
                  >
                    {result.name}
                  </button>
                );
              })}
            </div>
          )}

          {searchError && (
            <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 10 }}>{searchError}</div>
          )}

          <button onClick={handleUseGPS} style={{
            background: "transparent", border: "1px solid #333", borderRadius: 4,
            color: "#888", fontFamily: "inherit", fontSize: 11, padding: "4px 10px",
            cursor: "pointer", marginBottom: 14,
          }}>
            Use Current GPS
          </button>

          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: 10,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, color: "#666", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
              Selected Home
            </div>
            <div style={{ fontSize: 12, color: "#f0f0f0", fontWeight: 600 }}>{selectedHome.name}</div>
            <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
              {selectedHome.lat.toFixed(4)}, {selectedHome.lng.toFixed(4)}
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Default Location on Startup</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSelectedPref("gps")}
              style={{
                flex: 1, padding: "8px 10px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
                background: selectedPref === "gps" ? "#f97316" : "transparent",
                color: selectedPref === "gps" ? "#000" : "#777",
                border: selectedPref === "gps" ? "1px solid #f97316" : "1px solid #333",
                borderRadius: 6, cursor: "pointer",
              }}
            >
              Current Location
            </button>
            <button
              onClick={() => setSelectedPref("home")}
              style={{
                flex: 1, padding: "8px 10px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
                background: selectedPref === "home" ? "#f97316" : "transparent",
                color: selectedPref === "home" ? "#000" : "#777",
                border: selectedPref === "home" ? "1px solid #f97316" : "1px solid #333",
                borderRadius: 6, cursor: "pointer",
              }}
            >
              Home
            </button>
          </div>
        </section>

        {/* ── Personal Adjustment ── */}
        {onPersonalAdjChange && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 14, letterSpacing: 0.2 }}>
              Personal Adjustment
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#888" }}>How you feel temperatures</span>
              <span style={{ fontSize: 13, color: personalAdj !== 0 ? "#f97316" : "#e0e0e0", fontWeight: 700 }}>
                {personalAdj > 0 ? `+${personalAdj}` : personalAdj}&deg;F
              </span>
            </div>
            <input
              type="range" min={-5} max={5} step={1} value={personalAdj}
              onChange={(e) => onPersonalAdjChange(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f97316", marginBottom: 4 }}
            />
            <div style={{ fontSize: 10, color: "#555", textAlign: "center" }}>
              &larr; I run cold&nbsp;&nbsp;|&nbsp;&nbsp;I run hot &rarr;
            </div>
          </section>
        )}

        {/* ── Notifications ── */}
        {notifPermission !== undefined && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 14, letterSpacing: 0.2 }}>
              Notifications
            </div>

            {notifPermission === "denied" && (
              <div style={{ fontSize: 11, color: "#666", background: "#0a0a0a", borderRadius: 6, padding: "10px 12px" }}>
                Notifications are blocked in your browser settings.
              </div>
            )}

            {notifPermission === "default" && (
              <button onClick={onRequestNotifications} style={{
                display: "flex", alignItems: "center", gap: 8, background: "transparent",
                border: "1px solid #f97316", borderRadius: 6, color: "#f97316", fontFamily: "inherit",
                fontSize: 11, fontWeight: 600, padding: "8px 14px", cursor: "pointer",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                Enable Daily Notifications
              </button>
            )}

            {notifPermission === "granted" && (
              <>
                {editingNotifTime ? (
                  <div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
                      Pick a time to receive your daily outfit recommendation:
                    </div>
                    <NotifTimePicker
                      initialTime={notifTime || "07:00"}
                      onSave={handleSaveNotif}
                      onCancel={notifTime ? () => setEditingNotifTime(false) : undefined}
                    />
                  </div>
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#555">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                      </svg>
                      <span style={{ fontSize: 11, color: "#aaa" }}>Daily at</span>
                      <span style={{ fontSize: 12, color: "#f97316", fontWeight: 700 }}>
                        {notifTime ? formatTime12h(notifTime) : "—"}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingNotifTime(true)}
                      style={{
                        background: "transparent", border: "1px solid #333", borderRadius: 4,
                        color: "#888", fontFamily: "inherit", fontSize: 10, padding: "3px 8px", cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: "transparent", border: "1px solid #333", borderRadius: 4,
            color: "#888", fontFamily: "inherit", fontSize: 12, padding: "8px 16px", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            background: "#f97316", border: "none", borderRadius: 4,
            color: "#000", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            padding: "8px 16px", cursor: "pointer",
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
