export function getSkyLabel(cloudCover) {
  if (cloudCover < 0.3) return "Clear";
  if (cloudCover < 0.7) return "Partly Cloudy";
  return "Overcast";
}

export function getPrecipLabel(intensity) {
  if (!intensity || intensity < 0.01) return "None";
  if (intensity < 0.1) return "Drizzle";
  return "Rain";
}

export function formatHour(ts) {
  return new Date(ts * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}

export function formatTime12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}
