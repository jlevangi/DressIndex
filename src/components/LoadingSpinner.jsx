export default function LoadingSpinner({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0 20px" }}>
      <style>{`
        @keyframes spinRing {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
      `}</style>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "3px solid #1a1a1a",
        borderTopColor: "#f97316",
        animation: "spinRing 0.8s linear infinite",
        marginBottom: 12,
      }} />
      <div style={{
        fontSize: 12,
        color: "#888",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        animation: "pulseText 1.4s ease-in-out infinite",
      }}>
        {message}
      </div>
    </div>
  );
}
