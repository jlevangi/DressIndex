import NotifTimePicker from "./NotifTimePicker.jsx";
import { formatTime12h } from "../utils.js";

export default function HeaderAction({ installPrompt, isInstalled, notifPermission, notifTime, showTimePicker, onInstall, onRequestNotifications, onSaveNotifTime, onEditTime, onCancelEdit }) {
  if (installPrompt && !isInstalled) {
    return (
      <button onClick={onInstall} style={{
        display: "flex", alignItems: "center", gap: 6, background: "transparent",
        border: "1px solid #f97316", borderRadius: 6, color: "#f97316", fontFamily: "inherit",
        fontSize: 11, fontWeight: 600, padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Install
      </button>
    );
  }

  if (isInstalled && notifPermission === "default") {
    return (
      <button onClick={onRequestNotifications} style={{
        display: "flex", alignItems: "center", gap: 6, background: "transparent",
        border: "1px solid #f97316", borderRadius: 6, color: "#f97316", fontFamily: "inherit",
        fontSize: 11, fontWeight: 600, padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        Get notified!
      </button>
    );
  }

  if (notifPermission === "granted" && (showTimePicker || !notifTime)) {
    return <NotifTimePicker initialTime={notifTime || "07:00"} onSave={onSaveNotifTime} onCancel={notifTime ? onCancelEdit : undefined} />;
  }

  if (notifPermission === "granted" && notifTime) {
    return (
      <button onClick={onEditTime} style={{
        display: "flex", alignItems: "center", gap: 5, background: "transparent",
        border: "1px solid #333", borderRadius: 6, color: "#888", fontFamily: "inherit",
        fontSize: 11, padding: "6px 10px", cursor: "pointer", whiteSpace: "nowrap",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {formatTime12h(notifTime)}
      </button>
    );
  }

  return null;
}
