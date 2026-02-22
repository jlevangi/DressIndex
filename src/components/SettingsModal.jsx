import { useState } from "react";

export default function SettingsModal({ homeLocation, onSave, onCancel }) {
  const [name, setName] = useState(homeLocation.name);
  const [homeLat, setHomeLat] = useState(homeLocation.lat);
  const [homeLng, setHomeLng] = useState(homeLocation.lng);

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setHomeLat(+pos.coords.latitude.toFixed(4)); setHomeLng(+pos.coords.longitude.toFixed(4)); },
        () => {}
      );
    }
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

        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Name</label>
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid #333",
            borderRadius: 4, color: "#e0e0e0", fontFamily: "inherit", fontSize: 12, outline: "none",
            marginBottom: 12, boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Latitude</label>
            <input
              type="number" step="0.0001" value={homeLat}
              onChange={(e) => setHomeLat(+e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid #333",
                borderRadius: 4, color: "#e0e0e0", fontFamily: "inherit", fontSize: 12, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Longitude</label>
            <input
              type="number" step="0.0001" value={homeLng}
              onChange={(e) => setHomeLng(+e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid #333",
                borderRadius: 4, color: "#e0e0e0", fontFamily: "inherit", fontSize: 12, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <button onClick={handleUseGPS} style={{
          background: "transparent", border: "1px solid #333", borderRadius: 4,
          color: "#888", fontFamily: "inherit", fontSize: 11, padding: "4px 10px",
          cursor: "pointer", marginBottom: 16,
        }}>
          Use Current GPS
        </button>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: "transparent", border: "1px solid #333", borderRadius: 4,
            color: "#888", fontFamily: "inherit", fontSize: 12, padding: "8px 16px", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={() => onSave({ name: name.trim() || "Home", lat: homeLat, lng: homeLng })} style={{
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
