export default function WeatherSkeleton({ message = "Loading..." }) {
  const shimmer = {
    position: "relative",
    overflow: "hidden",
    background: "#111",
    border: "1px solid #1a1a1a",
    borderRadius: 8,
  };

  const shine = {
    position: "absolute",
    inset: 0,
    transform: "translateX(-100%)",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
    animation: "skeletonShimmer 1.5s infinite",
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <style>{`
        @keyframes skeletonShimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{ ...shimmer, height: 40, marginBottom: 14 }}>
        <div style={shine} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ ...shimmer, height: 26, width: 78, borderRadius: 4 }}>
            <div style={shine} />
          </div>
        ))}
      </div>

      <div style={{ ...shimmer, height: 160, marginBottom: 14 }}>
        <div style={shine} />
      </div>

      <div style={{ display: "flex", gap: 8, overflow: "hidden", marginBottom: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ ...shimmer, height: 108, minWidth: 102 }}>
            <div style={shine} />
          </div>
        ))}
      </div>

      <div style={{
        fontSize: 11,
        color: "#666",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        textAlign: "center",
        animation: "skeletonPulse 1.2s ease-in-out infinite",
      }}>
        {message}
      </div>
    </div>
  );
}
