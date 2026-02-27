export default function ViewSwitcher({ view, onViewChange }) {
  return (
    <div style={{
      display: "flex",
      border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", flex: 1,
    }}>
      {["today", "tomorrow"].map((day) => (
        <button
          key={day}
          onClick={() => onViewChange(day)}
          style={{
            flex: 1, padding: "8px 12px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
            background: view === day ? "var(--bg-secondary)" : "transparent",
            color: view === day ? "#f97316" : "var(--text-faint)",
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
