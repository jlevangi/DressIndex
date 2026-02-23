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
  canInstall,
  isInstalled,
  showIOSGuide,
  onDismissIOSGuide,
  notifPermission,
  notifTime,
  notifEnabled,
  onInstall,
  onRequestNotifications,
  onOpenSettings,
}) {
  if (canInstall && !isInstalled) {
    return (
      <>
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
        {showIOSGuide && (
          <div
            onClick={onDismissIOSGuide}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.7)",
              display: "flex", flexDirection: "column",
              justifyContent: "flex-end", alignItems: "center",
              padding: "0 24px 48px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1a1a1a", borderRadius: 12,
                padding: "20px 24px", maxWidth: 320, width: "100%",
                textAlign: "center", color: "#e0e0e0",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Install DressIndex</div>
              <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
                Tap the <strong style={{ color: "#e0e0e0" }}>Share</strong> button
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", margin: "0 4px" }}>
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                in the toolbar, then select <strong style={{ color: "#e0e0e0" }}>"Add to Home Screen"</strong>
              </div>
              <button
                onClick={onDismissIOSGuide}
                style={{
                  marginTop: 16, background: "#333", border: "none",
                  borderRadius: 6, color: "#aaa", fontSize: 13,
                  padding: "8px 20px", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
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
