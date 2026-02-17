import { useState, useMemo, useEffect, useCallback } from "react";

const DEFAULT_LAT = 28.1614;
const DEFAULT_LNG = -81.6137;
const DEFAULT_LOCATION = "Davenport, FL";

const LOCATIONS = [
  { label: "Home", lat: 28.1614, lng: -81.6137, name: "Davenport, FL" },
  { label: "Disney", lat: 28.3922, lng: -81.5812, name: "Bay Lake, FL" },
  { label: "Orlando", lat: 28.5383, lng: -81.3792, name: "Orlando, FL" },
  { label: "Miami", lat: 25.7617, lng: -80.1918, name: "Miami, FL" },
  { label: "Tampa", lat: 27.9506, lng: -82.4572, name: "Tampa, FL" },
  { label: "Cincinnati", lat: 39.1031, lng: -84.5120, name: "Cincinnati, OH" },
];

function getWindMod(speed) {
  if (speed <= 10) return 0;
  if (speed <= 15) return -2;
  if (speed <= 20) return -4;
  return -6;
}

function getSkyMod(cloudCover) {
  if (cloudCover < 0.3) return 0;
  if (cloudCover < 0.7) return -1.5;
  return -3;
}

function getSkyLabel(cloudCover) {
  if (cloudCover < 0.3) return "Clear";
  if (cloudCover < 0.7) return "Partly Cloudy";
  return "Overcast";
}

function getPrecipMod(intensity) {
  if (!intensity || intensity < 0.01) return 0;
  if (intensity < 0.1) return -2;
  return -4;
}

function getPrecipLabel(intensity) {
  if (!intensity || intensity < 0.01) return "None";
  if (intensity < 0.1) return "Drizzle";
  return "Rain";
}

function getTimeMod(timestamp, sunsetTime) {
  if (!sunsetTime) return 0;
  const diff = (sunsetTime - timestamp) / 60;
  if (diff <= 0) return -3;
  if (diff <= 30) return -3;
  if (diff <= 60) return -2;
  const hour = new Date(timestamp * 1000).getHours();
  if (hour >= 15 && hour < 16) return -1;
  if (hour >= 10 && hour < 15) return 0;
  if (hour < 10) return -1;
  return -2;
}

function dewPointMod(dp) {
  if (dp >= 65) return 3;
  if (dp >= 60) return 2;
  if (dp >= 55) return 1;
  return 0;
}

function computeEffective(data, personalAdj, sunsetTime) {
  const wMod = getWindMod(data.windSpeed || 0);
  const sMod = getSkyMod(data.cloudCover || 0);
  const pMod = getPrecipMod(data.precipIntensity);
  const tMod = getTimeMod(data.time, sunsetTime);
  const dMod = dewPointMod(data.dewPoint || 50);
  const total = wMod + sMod + pMod + tMod + dMod + personalAdj;
  return {
    base: data.temperature,
    effective: data.temperature + total,
    mods: { wind: wMod, sky: sMod, precip: pMod, time: tMod, dewPt: dMod, personal: personalAdj },
    total,
  };
}

function getClothing(eff) {
  let top, bottom, color;
  if (eff >= 72) { top = "T-Shirt"; bottom = "Shorts"; color = "#22c55e"; }
  else if (eff >= 66) { top = "Crew Neck"; bottom = "Shorts"; color = "#eab308"; }
  else if (eff >= 58) { top = "Hoodie"; bottom = "Shorts"; color = "#f97316"; }
  else { top = "Jacket"; bottom = "Pants"; color = "#ef4444"; }
  return { top, bottom, color };
}

function formatHour(ts) {
  return new Date(ts * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}

function formatTime12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function HourCard({ data, personalAdj, sunsetTime, isNow }) {
  const calc = computeEffective(data, personalAdj, sunsetTime);
  const clothing = getClothing(calc.effective);
  const isPast = data.time * 1000 < Date.now() && !isNow;

  return (
    <div style={{
      minWidth: 110,
      background: isNow ? "#1a1a1a" : "#111",
      border: isNow ? "1px solid #f97316" : "1px solid #1a1a1a",
      borderRadius: 8,
      padding: "12px 10px",
      opacity: isPast ? 0.4 : 1,
      position: "relative",
      flexShrink: 0,
    }}>
      {isNow && (
        <div style={{
          position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
          background: "#f97316", color: "#000", fontSize: 9, fontWeight: 700,
          padding: "1px 6px", borderRadius: 3, letterSpacing: 1,
        }}>NOW</div>
      )}
      <div style={{ fontSize: 12, color: isNow ? "#f0f0f0" : "#888", fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
        {formatHour(data.time)}
      </div>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#e0e0e0" }}>{Math.round(data.temperature)}°</span>
      </div>
      <div style={{ fontSize: 10, color: "#555", textAlign: "center", marginBottom: 8, lineHeight: 1.4 }}>
        {getSkyLabel(data.cloudCover)}<br />
        Wind {Math.round(data.windSpeed)} mph<br />
        DP {Math.round(data.dewPoint)}°
        {data.precipIntensity > 0.01 && <><br />{getPrecipLabel(data.precipIntensity)}</>}
      </div>
      <div style={{ borderTop: "1px solid #222", paddingTop: 8, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>EFF {calc.effective.toFixed(0)}°F</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: clothing.color }}>{clothing.top}</div>
        <div style={{ fontSize: 11, color: clothing.color, opacity: 0.7 }}>{clothing.bottom}</div>
      </div>
    </div>
  );
}

function DayAheadPanel({ hourlySlice, personalAdj, sunsetTime, currentData }) {
  const now = Math.floor(Date.now() / 1000);
  const futureHours = hourlySlice.filter((h) => h.time > now);
  if (!futureHours.length || !currentData) return null;

  const futureCalcs = futureHours.map((h) => ({
    data: h,
    calc: computeEffective(h, personalAdj, sunsetTime),
  }));

  const coldest = futureCalcs.reduce((min, cur) =>
    cur.calc.effective < min.calc.effective ? cur : min
  );
  const warmest = futureCalcs.reduce((max, cur) =>
    cur.calc.effective > max.calc.effective ? cur : max
  );

  const sunsetEntry = sunsetTime ? futureCalcs.reduce((closest, cur) =>
    Math.abs(cur.data.time - sunsetTime) < Math.abs(closest.data.time - sunsetTime) ? cur : closest
  ) : null;

  const currentCalc = computeEffective(currentData, personalAdj, sunsetTime);
  const currentClothing = getClothing(currentCalc.effective);
  const coldestClothing = getClothing(coldest.calc.effective);

  const needsWarmer = coldest.calc.effective < currentCalc.effective &&
    (coldestClothing.top !== currentClothing.top || coldestClothing.bottom !== currentClothing.bottom);

  return (
    <div style={{
      background: "#111", border: `1px solid ${needsWarmer ? "#f9731640" : "#1a1a1a"}`,
      borderRadius: 8, padding: 24, marginBottom: 20,
    }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Rest of Day
      </div>

      {needsWarmer ? (
        <div style={{
          background: "rgba(249,115,22,0.08)", border: "1px solid #f9731630",
          borderRadius: 6, padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: "#f97316", fontWeight: 600, marginBottom: 4 }}>
            Bring warmer layers
          </div>
          <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5 }}>
            By {formatHour(coldest.data.time)} it'll feel like{" "}
            <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{coldest.calc.effective.toFixed(0)}°F</span>
            {" "}— you'll want a{" "}
            <span style={{ color: coldestClothing.color, fontWeight: 600 }}>{coldestClothing.top}</span>
            {coldestClothing.bottom !== currentClothing.bottom && (
              <> and <span style={{ color: coldestClothing.color, fontWeight: 600 }}>{coldestClothing.bottom}</span></>
            )}.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
          Conditions stay similar — what you're wearing now should work all day.
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 6, padding: 12, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Coldest Point
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: coldestClothing.color }}>
              {coldest.calc.effective.toFixed(0)}°
            </span>
            <span style={{ fontSize: 11, color: "#555" }}>eff</span>
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
            {formatHour(coldest.data.time)} · {coldestClothing.top}
          </div>
        </div>
        {sunsetEntry && (
          <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 6, padding: 12, border: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              At Sunset
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: getClothing(sunsetEntry.calc.effective).color }}>
                {sunsetEntry.calc.effective.toFixed(0)}°
              </span>
              <span style={{ fontSize: 11, color: "#555" }}>eff</span>
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
              {formatHour(sunsetEntry.data.time)} · {getClothing(sunsetEntry.calc.effective).top}
            </div>
          </div>
        )}
        <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 6, padding: 12, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Warmest Point
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: getClothing(warmest.calc.effective).color }}>
              {warmest.calc.effective.toFixed(0)}°
            </span>
            <span style={{ fontSize: 11, color: "#555" }}>eff</span>
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
            {formatHour(warmest.data.time)} · {getClothing(warmest.calc.effective).top}
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentPanel({ data, personalAdj, sunsetTime }) {
  const calc = computeEffective(data, personalAdj, sunsetTime);
  const clothing = getClothing(calc.effective);
  const modEntries = [
    { label: "Wind", val: calc.mods.wind },
    { label: "Sky", val: calc.mods.sky },
    { label: "Precip", val: calc.mods.precip },
    { label: "Time", val: calc.mods.time },
    { label: "Dew Pt", val: calc.mods.dewPt },
    { label: "Personal", val: calc.mods.personal },
  ];

  return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
            Right Now
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#f0f0f0" }}>{Math.round(data.temperature)}°F</span>
            <span style={{ fontSize: 14, color: "#555" }}>feels {Math.round(data.apparentTemperature || data.temperature)}°</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {getSkyLabel(data.cloudCover)} · Wind {Math.round(data.windSpeed)} mph · DP {Math.round(data.dewPoint)}° · Humidity {Math.round((data.humidity || 0) * 100)}%
            {data.precipIntensity > 0.01 && ` · ${getPrecipLabel(data.precipIntensity)}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>EFFECTIVE</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f97316" }}>{calc.effective.toFixed(1)}°F</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{
          background: "rgba(249,115,22,0.1)", border: "1px solid #f97316", borderRadius: 4,
          padding: "3px 8px", fontSize: 11, color: "#ccc",
        }}>
          <span style={{ color: "#666" }}>Base </span>{Math.round(data.temperature)}
        </span>
        {modEntries.map((m) => (
          <span key={m.label} style={{
            background: m.val === 0 ? "rgba(255,255,255,0.02)" : "rgba(249,115,22,0.06)",
            border: `1px solid ${m.val === 0 ? "#222" : "#f9731630"}`,
            borderRadius: 4, padding: "3px 8px", fontSize: 11,
            color: m.val === 0 ? "#333" : "#999",
          }}>
            <span style={{ color: "#555" }}>{m.label} </span>
            {m.val > 0 ? "+" : m.val < 0 ? "−" : ""}{Math.abs(m.val)}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 6, padding: 16, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Top</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: clothing.color }}>{clothing.top}</div>
        </div>
        <div style={{ flex: 1, background: "#0a0a0a", borderRadius: 6, padding: 16, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Bottom</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: clothing.color }}>{clothing.bottom}</div>
        </div>
      </div>
    </div>
  );
}

function NotifTimePicker({ initialTime, onSave, onCancel }) {
  const [time, setTime] = useState(initialTime || "07:00");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={{
          background: "#0a0a0a", border: "1px solid #333", borderRadius: 4,
          color: "#e0e0e0", fontFamily: "inherit", fontSize: 11, padding: "4px 6px",
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
            background: "transparent", color: "#555", border: "1px solid #333",
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

function HeaderAction({ installPrompt, isInstalled, notifPermission, notifTime, showTimePicker, onInstall, onRequestNotifications, onSaveNotifTime, onEditTime, onCancelEdit }) {
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

export default function ClothingAlgo() {
  const envKey = window.__CONFIG__?.PIRATE_WEATHER_API_KEY || import.meta.env.VITE_PIRATE_WEATHER_API_KEY || "";
  const [apiKey, setApiKey] = useState(envKey);
  const [keyInput, setKeyInput] = useState("");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [locationName, setLocationName] = useState(DEFAULT_LOCATION);
  const [personalAdj, setPersonalAdj] = useState(0);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches
  );
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [notifTime, setNotifTime] = useState(
    () => localStorage.getItem("dressindex_notif_time")
  );
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchWeather = useCallback(async (key, la, ln) => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.pirateweather.net/forecast/${key}/${la},${ln}?units=us`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = await res.json();
      setWeatherData(data);
      setLastFetch(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    fetchWeather(apiKey, lat, lng);
    const interval = setInterval(() => fetchWeather(apiKey, lat, lng), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey, lat, lng, fetchWeather]);

  // Detect standalone (installed PWA) mode
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e) => setIsInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Capture beforeinstallprompt and appinstalled events
  useEffect(() => {
    const onBeforeInstall = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Schedule daily notification (single-shot; effect re-runs on deps change)
  useEffect(() => {
    if (notifPermission !== "granted" || !notifTime) return;
    const [h, m] = notifTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    const timerId = setTimeout(() => fireClothingNotification(), delay);
    return () => clearTimeout(timerId);
  }, [notifPermission, notifTime, weatherData, personalAdj]);

  const sunsetTime = weatherData?.daily?.data?.[0]?.sunsetTime || null;

  const hourlySlice = useMemo(() => {
    if (!weatherData?.hourly?.data) return [];
    const startOfDay = new Date();
    startOfDay.setHours(6, 0, 0, 0);
    const startTs = Math.floor(startOfDay.getTime() / 1000);
    const endOfDay = new Date();
    endOfDay.setHours(23, 0, 0, 0);
    const endTs = Math.floor(endOfDay.getTime() / 1000);
    return weatherData.hourly.data.filter((h) => h.time >= startTs && h.time <= endTs);
  }, [weatherData]);

  const currentData = weatherData?.currently;

  const nowHourTs = useMemo(() => {
    if (!hourlySlice.length) return null;
    const now = Math.floor(Date.now() / 1000);
    let closest = hourlySlice[0];
    for (const h of hourlySlice) {
      if (Math.abs(h.time - now) < Math.abs(closest.time - now)) closest = h;
    }
    return closest.time;
  }, [hourlySlice]);

  const handleSaveKey = () => {
    if (keyInput.trim()) setApiKey(keyInput.trim());
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => setError("Geolocation denied. Using default location.")
      );
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (result.outcome === "accepted") setIsInstalled(true);
  };

  const handleRequestNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") setShowTimePicker(true);
  };

  const handleSaveNotifTime = (time) => {
    setNotifTime(time);
    localStorage.setItem("dressindex_notif_time", time);
    setShowTimePicker(false);
  };

  const fireClothingNotification = () => {
    const current = weatherData?.currently;
    const sunset = weatherData?.daily?.data?.[0]?.sunsetTime || null;
    let body;
    if (current) {
      const calc = computeEffective(current, personalAdj, sunset);
      const clothing = getClothing(calc.effective);
      body = `${Math.round(calc.effective)}°F effective — wear a ${clothing.top} + ${clothing.bottom}`;
    } else {
      body = "Open DressIndex to see today's recommendation";
    }
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: "DressIndex",
        body,
      });
    } else {
      new Notification("DressIndex", { body, tag: "daily-clothing", icon: "/pwa-192x192.png" });
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e0e0e0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: "32px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
              Florida Comfort Index
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", letterSpacing: -0.5 }}>
              Clothing Algorithm
            </div>
            <div style={{ width: 40, height: 2, background: "#f97316", marginTop: 8 }} />
          </div>
          <HeaderAction
            installPrompt={installPrompt}
            isInstalled={isInstalled}
            notifPermission={notifPermission}
            notifTime={notifTime}
            showTimePicker={showTimePicker}
            onInstall={handleInstall}
            onRequestNotifications={handleRequestNotifications}
            onSaveNotifTime={handleSaveNotifTime}
            onEditTime={() => setShowTimePicker(true)}
            onCancelEdit={() => setShowTimePicker(false)}
          />
        </div>

        {!apiKey ? (
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              PirateWeather API Key
            </div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
              Get a free key at{" "}
              <a href="https://pirateweather.net" target="_blank" rel="noreferrer" style={{ color: "#f97316" }}>
                pirateweather.net
              </a>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                placeholder="Paste API key"
                style={{
                  flex: 1, padding: "8px 12px", background: "#0a0a0a", border: "1px solid #333",
                  borderRadius: 4, color: "#e0e0e0", fontFamily: "inherit", fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={handleSaveKey}
                style={{
                  padding: "8px 16px", background: "#f97316", color: "#000", border: "none",
                  borderRadius: 4, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Connect
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Status bar */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16, padding: "8px 12px", background: "#111", borderRadius: 6,
              border: "1px solid #1a1a1a", flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "#666" }}>{locationName}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {lastFetch && (
                  <span style={{ fontSize: 10, color: "#444" }}>
                    {lastFetch.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
                <button
                  onClick={() => fetchWeather(apiKey, lat, lng)}
                  disabled={loading}
                  style={{
                    background: "transparent", border: "1px solid #333", borderRadius: 3,
                    color: loading ? "#333" : "#888", fontSize: 10, padding: "2px 8px",
                    cursor: loading ? "default" : "pointer", fontFamily: "inherit",
                  }}
                >
                  {loading ? "..." : "Refresh"}
                </button>
                <button
                  onClick={() => { setApiKey(""); setWeatherData(null); setKeyInput(""); }}
                  style={{
                    background: "transparent", border: "1px solid #333", borderRadius: 3,
                    color: "#555", fontSize: 10, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Quick location buttons */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap",
            }}>
              <button
                onClick={handleGeolocate}
                style={{
                  padding: "4px 12px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
                  background: !LOCATIONS.some((l) => l.name === locationName) ? "#f97316" : "transparent",
                  color: !LOCATIONS.some((l) => l.name === locationName) ? "#000" : "#666",
                  border: !LOCATIONS.some((l) => l.name === locationName) ? "1px solid #f97316" : "1px solid #333",
                  borderRadius: 4, cursor: "pointer",
                }}
              >
                Current Location
              </button>
              {LOCATIONS.map((loc) => {
                const isActive = locationName === loc.name;
                return (
                  <button
                    key={loc.label}
                    onClick={() => { setLat(loc.lat); setLng(loc.lng); setLocationName(loc.name); }}
                    style={{
                      padding: "4px 12px", fontSize: 11, fontFamily: "inherit", fontWeight: 600,
                      background: isActive ? "#f97316" : "transparent",
                      color: isActive ? "#000" : "#666",
                      border: isActive ? "1px solid #f97316" : "1px solid #333",
                      borderRadius: 4, cursor: "pointer",
                    }}
                  >
                    {loc.label}
                  </button>
                );
              })}
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 6,
                padding: "8px 12px", fontSize: 12, color: "#ef4444", marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Personal adjustment */}
            <div style={{
              background: "#111", border: "1px solid #1a1a1a", borderRadius: 8,
              padding: "16px 24px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#a0a0a0" }}>Personal Adjustment</span>
                <span style={{ fontSize: 13, color: "#e0e0e0", fontWeight: 600 }}>
                  {personalAdj > 0 ? `+${personalAdj}` : personalAdj}°F
                </span>
              </div>
              <input
                type="range" min={-5} max={5} step={1} value={personalAdj}
                onChange={(e) => setPersonalAdj(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f97316" }}
              />
              <div style={{ fontSize: 11, color: "#555", marginTop: 2, textAlign: "center" }}>
                ← Feeling colder today&nbsp;&nbsp;|&nbsp;&nbsp;Feeling warmer today →
              </div>
            </div>

            {/* Current conditions */}
            {currentData && <CurrentPanel data={currentData} personalAdj={personalAdj} sunsetTime={sunsetTime} />}

            {/* Day ahead advisory */}
            {hourlySlice.length > 0 && currentData && (
              <DayAheadPanel
                hourlySlice={hourlySlice}
                personalAdj={personalAdj}
                sunsetTime={sunsetTime}
                currentData={currentData}
              />
            )}

            {/* Hourly timeline */}
            {hourlySlice.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>
                  Today's Timeline — 6 AM to 11 PM
                </div>
                <div style={{
                  display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, paddingTop: 10,
                }}>
                  {hourlySlice.map((h) => (
                    <HourCard
                      key={h.time}
                      data={h}
                      personalAdj={personalAdj}
                      sunsetTime={sunsetTime}
                      isNow={h.time === nowHourTs}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tier reference */}
            {currentData && (
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 24px" }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Tier Map</div>
                {[
                  { label: "T-Shirt + Shorts", range: "≥ 72°F", min: 72, max: Infinity, color: "#22c55e" },
                  { label: "Crew Neck + Shorts", range: "66 – 72°F", min: 66, max: 72, color: "#eab308" },
                  { label: "Hoodie + Shorts", range: "58 – 66°F", min: 58, max: 66, color: "#f97316" },
                  { label: "Jacket + Pants", range: "< 58°F", min: -Infinity, max: 58, color: "#ef4444" },
                ].map((tier) => {
                  const eff = computeEffective(currentData, personalAdj, sunsetTime).effective;
                  const isActive = eff >= tier.min && eff < tier.max;
                  return (
                    <div key={tier.label} style={{
                      display: "flex", justifyContent: "space-between", padding: "4px 8px",
                      fontSize: 11, color: isActive ? tier.color : "#333",
                      background: isActive ? `${tier.color}10` : "transparent",
                      borderRadius: 3, marginBottom: 2,
                      borderLeft: isActive ? `2px solid ${tier.color}` : "2px solid transparent",
                    }}>
                      <span>{tier.label}</span>
                      <span>{tier.range}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}