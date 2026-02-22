export default function ViewSwitcher({ view, onViewChange }) {
  return (
    <div style={{
      display: "flex", marginBottom: 20,
      border: "1px solid #1a1a1a", borderRadius: 6, overflow: "hidden",
    }}>
      {["today", "tomorrow"].map((day) => (
        <button
          key={day}
          onClick={() => onViewChange(day)}
          style={{
            flex: 1, padding: "8px 12px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
            background: view === day ? "#1a1a1a" : "transparent",
            color: view === day ? "#f97316" : "#555",
            border: "none", borderBottom: view === day ? "2px solid #f97316" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          {day === "today" ? "Today" : "Tomorrow"}
        </button>
      ))}
    </div>
  );
}
