import { useState } from "react";
import { searchCity, reverseGeocode } from "../geocode.js";

export default function SettingsModal({ homeLocation, defaultLocPref, onSave, onSaveDefaultLocPref, onCancel }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [selectedHome, setSelectedHome] = useState(homeLocation);
  const [selectedPref, setSelectedPref] = useState(defaultLocPref === "home" ? "home" : "gps");

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

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
    }} onClick={onCancel}>
      <div style={{
        background: "#111", border: "1px solid #333", borderRadius: 10, padding: 24,
        width: "100%", maxWidth: 360,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0", marginBottom: 16 }}>
          Home Location
        </div>

        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Search by City Name</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {searchResults.map((result) => {
              const isSelected = selectedHome.lat === result.lat && selectedHome.lng === result.lng;
              return (
                <button
                  key={`${result.name}:${result.lat}:${result.lng}`}
                  onClick={() => setSelectedHome(result)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 10px",
                    fontSize: 12,
                    fontFamily: "inherit",
                    background: isSelected ? "rgba(249,115,22,0.15)" : "#0a0a0a",
                    border: isSelected ? "1px solid #f97316" : "1px solid #333",
                    borderRadius: 6,
                    color: isSelected ? "#f97316" : "#ccc",
                    cursor: "pointer",
                  }}
                >
                  {result.name}
                </button>
              );
            })}
          </div>
        )}

        {searchError && (
          <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 10 }}>
            {searchError}
          </div>
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
          <div style={{ fontSize: 12, color: "#f0f0f0", fontWeight: 600 }}>
            {selectedHome.name}
          </div>
          <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
            {selectedHome.lat.toFixed(4)}, {selectedHome.lng.toFixed(4)}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
          Default Location on Startup
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
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
