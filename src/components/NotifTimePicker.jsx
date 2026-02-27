import { useState } from "react";

export default function NotifTimePicker({ initialTime, onSave, onCancel }) {
  const [time, setTime] = useState(initialTime || "07:00");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={{
          background: "var(--bg-input)", border: "1px solid var(--border-btn)", borderRadius: 4,
          color: "var(--text)", fontFamily: "inherit", fontSize: 11, padding: "4px 6px",
          outline: "none",
        }}
      />
      <button
        onClick={() => onSave(time)}
        style={{
          background: "#f97316", color: "#000", border: "none", borderRadius: 4,
          fontFamily: "inherit", fontSize: 10, fontWeight: 600, padding: "4px 10px",
          cursor: "pointer",
        }}
      >
        Save
      </button>
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            background: "transparent", color: "var(--text-faint)", border: "1px solid var(--border-btn)",
            borderRadius: 4, fontFamily: "inherit", fontSize: 10, padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
