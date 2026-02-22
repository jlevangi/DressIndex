import { formatTime12h } from "../utils.js";

const baseActionButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "transparent",
  borderRadius: 6,
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 600,
  padding: "8px 12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export default function HeaderAction({
  installPrompt,
  isInstalled,
  notifPermission,
  notifTime,
  notifEnabled,
  onInstall,
  onRequestNotifications,
  onOpenSettings,
}) {
  if (installPrompt && !isInstalled) {
    return (
      <button
        onClick={onInstall}
        style={{
          ...baseActionButtonStyle,
          border: "1px solid #f97316",
          color: "#f97316",
        }}
      >
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
      <button
        onClick={onRequestNotifications}
        style={{
          ...baseActionButtonStyle,
          border: "1px solid #f97316",
          color: "#f97316",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        Get notified!
      </button>
    );
  }

  if (notifPermission === "granted" && notifEnabled === false) {
    return (
      <button
        onClick={onOpenSettings}
        style={{
          ...baseActionButtonStyle,
          border: "1px solid #2a2a2a",
          color: "#666",
          fontWeight: 500,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
          <line x1="4" y1="4" x2="20" y2="20" />
        </svg>
        Notifications off
      </button>
    );
  }

  if (notifPermission === "granted" && notifTime) {
    return (
      <button
        onClick={onOpenSettings}
        style={{
          ...baseActionButtonStyle,
          border: "1px solid #2a2a2a",
          color: "#666",
          fontWeight: 500,
          gap: 5,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#555">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {formatTime12h(notifTime)}
      </button>
    );
  }

  if (notifPermission === "granted" && !notifTime) {
    return (
      <button
        onClick={onOpenSettings}
        style={{
          ...baseActionButtonStyle,
          border: "1px solid #333",
          color: "#888",
          fontWeight: 500,
          gap: 5,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        Set time
      </button>
    );
  }

  return null;
}
