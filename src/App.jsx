import { useState, useEffect, useRef } from "react";
import { getConfig, setConfig } from "./idb-config.js";
import useWeather from "./hooks/useWeather.js";
import useLocation from "./hooks/useLocation.js";
import useInstall from "./hooks/useInstall.js";
import useNotifications from "./hooks/useNotifications.js";
import HourCard from "./components/HourCard.jsx";
import CurrentPanel from "./components/CurrentPanel.jsx";
import DayAheadPanel from "./components/DayAheadPanel.jsx";
import TomorrowSummaryPanel from "./components/TomorrowSummaryPanel.jsx";
import HeaderAction from "./components/HeaderAction.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import OnboardingSurvey from "./components/OnboardingSurvey.jsx";
import ApiKeyEntry from "./components/ApiKeyEntry.jsx";
import LocationBar from "./components/LocationBar.jsx";
import PersonalAdjSlider from "./components/PersonalAdjSlider.jsx";
import ViewSwitcher from "./components/ViewSwitcher.jsx";
import TierMapPanel from "./components/TierMap.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import WeatherSkeleton from "./components/WeatherSkeleton.jsx";

const brandHeaderStyles = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: {
    width: 40,
    height: 40,
    display: "block",
  },
  titleGroup: {
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f0f0f0",
    letterSpacing: -0.5,
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 10,
    color: "#555",
    letterSpacing: 0.2,
    lineHeight: 1.3,
    marginTop: 2,
  },
};

export default function ClothingAlgo() {
  const envKey = window.__CONFIG__?.PIRATE_WEATHER_API_KEY || import.meta.env.VITE_PIRATE_WEATHER_API_KEY || "";
  const [apiKey, setApiKey] = useState(envKey);
  const [keyInput, setKeyInput] = useState("");
  const [personalAdj, setPersonalAdj] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(null); // null=loading, true/false
  const [defaultLocPref, setDefaultLocPref] = useState(null);
  const [view, setView] = useState("today");
  const [showAdjPopup, setShowAdjPopup] = useState(false);

  const {
    homeLocation, lat, lng, locationName,
    showSettings, setShowSettings,
    locations,
    handleGeolocate, handleSaveHome, selectLocation,
  } = useLocation(defaultLocPref);

  const {
    weatherData, setWeatherData,
    loading, error, setError, lastFetch,
    fetchWeather,
    sunsetTime, tomorrowSunsetTime, currentData,
    hourlySlice, todayTimelineSlice, tomorrowHourlySlice, tomorrowTimelineSlice,
    nowHourTs,
  } = useWeather(apiKey, lat, lng);

  const { installPrompt, isInstalled, handleInstall } = useInstall();

  const {
    notifPermission, notifTime, notifEnabled,
    showTimePicker, setShowTimePicker,
    handleRequestNotifications, handleSaveNotifTime, handleSetNotifEnabled,
  } = useNotifications({ weatherData, personalAdj, apiKey, lat, lng });

  // When notifications are just granted (showTimePicker), open settings to set time
  useEffect(() => {
    if (showTimePicker) {
      setShowSettings(true);
    }
  }, [showTimePicker, setShowSettings]);

  // Load onboarding state + persisted personalAdj from IndexedDB
  useEffect(() => {
    (async () => {
      try {
        const pref = await getConfig("defaultLocationPref");
        setDefaultLocPref(pref === "home" ? "home" : "gps");

        const done = await getConfig("onboardingComplete");
        if (done) {
          const savedAdj = await getConfig("personalAdj");
          if (typeof savedAdj === "number") setPersonalAdj(savedAdj);
          setOnboardingDone(true);
        } else {
          const hasHome = localStorage.getItem("dressindex_home");
          if (hasHome) {
            await setConfig("onboardingComplete", true).catch(() => {});
            setOnboardingDone(true);
          } else {
            setOnboardingDone(false);
          }
        }
      } catch (_) {
        setDefaultLocPref("gps");
        setOnboardingDone(true);
      }
    })();
  }, []);

  // Debounced persist of personalAdj to IndexedDB
  const adjDebounceRef = useRef(null);
  useEffect(() => {
    if (onboardingDone !== true) return;
    clearTimeout(adjDebounceRef.current);
    adjDebounceRef.current = setTimeout(() => {
      setConfig("personalAdj", personalAdj).catch(() => {});
    }, 500);
    return () => clearTimeout(adjDebounceRef.current);
  }, [personalAdj, onboardingDone]);

  const handleSaveKey = () => {
    if (keyInput.trim()) setApiKey(keyInput.trim());
  };

  const handleSaveDefaultLocPref = (pref) => {
    const normalized = pref === "home" ? "home" : "gps";
    setDefaultLocPref(normalized);
    setConfig("defaultLocationPref", normalized).catch(() => {});
  };

  // Onboarding render gating
  if (onboardingDone === null) {
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
          <div style={{ marginBottom: 24 }}>
            <div style={brandHeaderStyles.brand}>
              <div style={brandHeaderStyles.iconWrap}>
                <img src="/appicon.svg" alt="" aria-hidden="true" style={brandHeaderStyles.icon} />
              </div>
              <div style={brandHeaderStyles.titleGroup}>
                <div style={brandHeaderStyles.title}>DressIndex</div>
                <div style={brandHeaderStyles.subtitle}>Data Driven Clothing Decision Index</div>
              </div>
            </div>
          </div>
          <WeatherSkeleton message="Booting..." />
        </div>
      </div>
    );
  }

  if (onboardingDone === false) {
    return (
      <OnboardingSurvey
        onComplete={(adj, home, pref) => {
          setPersonalAdj(adj);
          if (home) handleSaveHome(home);
          handleSaveDefaultLocPref(pref || "gps");
          setOnboardingDone(true);
        }}
      />
    );
  }

  const adjLabel = personalAdj > 0 ? `+${personalAdj}°F` : personalAdj < 0 ? `${personalAdj}°F` : "0°F";
  const adjIsNonZero = personalAdj !== 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e0e0e0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: "24px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={brandHeaderStyles.row}>
          <div style={brandHeaderStyles.brand}>
            <div style={brandHeaderStyles.iconWrap}>
              <img src="/appicon.svg" alt="" aria-hidden="true" style={brandHeaderStyles.icon} />
            </div>
            <div style={brandHeaderStyles.titleGroup}>
              <div style={brandHeaderStyles.title}>DressIndex</div>
              <div style={brandHeaderStyles.subtitle}>Data Driven Clothing Decision Index</div>
            </div>
          </div>
          <HeaderAction
            installPrompt={installPrompt}
            isInstalled={isInstalled}
            notifPermission={notifPermission}
            notifTime={notifTime}
            notifEnabled={notifEnabled}
            onInstall={handleInstall}
            onRequestNotifications={handleRequestNotifications}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>

        {!apiKey ? (
          <ApiKeyEntry keyInput={keyInput} onKeyInputChange={setKeyInput} onSaveKey={handleSaveKey} />
        ) : (
          <>
            {/* ── Location bar ── */}
            <LocationBar
              locationName={locationName}
              lastFetch={lastFetch}
              loading={loading}
              locations={locations}
              onRefresh={() => fetchWeather(apiKey, lat, lng)}
              onReset={() => { setApiKey(""); setWeatherData(null); setKeyInput(""); }}
              onSettings={() => setShowSettings(true)}
              onGeolocate={() => handleGeolocate(setError)}
              onSelectLocation={selectLocation}
            />

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 6,
                padding: "8px 12px", fontSize: 12, color: "#ef4444", marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* ── View switcher + personal adj badge ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <ViewSwitcher view={view} onViewChange={setView} />

              {/* Personal adjustment pill — click to open slider popup */}
              <button
                onClick={() => setShowAdjPopup(true)}
                title="Personal temperature adjustment — click to edit"
                style={{
                  display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                  background: adjIsNonZero ? "rgba(249,115,22,0.1)" : "#111",
                  border: adjIsNonZero ? "1px solid rgba(249,115,22,0.5)" : "1px solid #1a1a1a",
                  borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit",
                  color: adjIsNonZero ? "#f97316" : "#555", fontSize: 11, fontWeight: adjIsNonZero ? 700 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7H4M16 12H4M12 17H4" />
                </svg>
                {adjLabel}
              </button>
            </div>

            {!currentData && !error && (
              <>
                <LoadingSpinner message={lat === null ? "Locating..." : "Fetching weather..."} />
                <WeatherSkeleton message={lat === null ? "Locating..." : "Fetching weather..."} />
              </>
            )}

            {view === "today" ? (
              <>
                {currentData && <CurrentPanel data={currentData} personalAdj={personalAdj} sunsetTime={sunsetTime} />}
                {hourlySlice.length > 0 && currentData && (
                  <DayAheadPanel
                    hourlySlice={hourlySlice}
                    personalAdj={personalAdj}
                    sunsetTime={sunsetTime}
                    currentData={currentData}
                  />
                )}
                {todayTimelineSlice.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>
                      Today's Timeline
                    </div>
                    <div style={{
                      display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, paddingTop: 10,
                    }}>
                      {todayTimelineSlice.map((h) => (
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
              </>
            ) : (
              <>
                <TomorrowSummaryPanel
                  hourlySlice={tomorrowHourlySlice}
                  personalAdj={personalAdj}
                  sunsetTime={tomorrowSunsetTime}
                />
                {tomorrowTimelineSlice.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>
                      Tomorrow's Timeline
                    </div>
                    <div style={{
                      display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, paddingTop: 10,
                    }}>
                      {tomorrowTimelineSlice.map((h) => (
                        <HourCard
                          key={h.time}
                          data={h}
                          personalAdj={personalAdj}
                          sunsetTime={tomorrowSunsetTime}
                          isNow={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {currentData && <TierMapPanel currentData={currentData} personalAdj={personalAdj} sunsetTime={sunsetTime} />}
          </>
        )}
      </div>

      {/* ── Personal Adjustment Popup ── */}
      {showAdjPopup && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
          }}
          onClick={() => setShowAdjPopup(false)}
        >
          <div
            style={{
              background: "#111", border: "1px solid #333", borderRadius: 10, padding: 24,
              width: "100%", maxWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>Personal Adjustment</div>
              <div style={{
                fontSize: 20, fontWeight: 700,
                color: adjIsNonZero ? "#f97316" : "#888",
              }}>
                {adjLabel}
              </div>
            </div>

            <PersonalAdjSlider value={personalAdj} onChange={setPersonalAdj} />

            <div style={{ fontSize: 11, color: "#555", marginTop: 12, lineHeight: 1.5 }}>
              Shifts the effective temperature up or down to match how <em>you</em> personally feel the weather.
            </div>

            <button
              onClick={() => setShowAdjPopup(false)}
              style={{
                marginTop: 18, width: "100%", padding: "9px 0", background: "#f97316",
                border: "none", borderRadius: 6, color: "#000", fontFamily: "inherit",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {showSettings && (
        <SettingsModal
          homeLocation={homeLocation}
          defaultLocPref={defaultLocPref || "gps"}
          onSave={handleSaveHome}
          onSaveDefaultLocPref={handleSaveDefaultLocPref}
          onCancel={() => { setShowSettings(false); setShowTimePicker(false); }}
          personalAdj={personalAdj}
          onPersonalAdjChange={setPersonalAdj}
          notifPermission={notifPermission}
          notifTime={notifTime}
          notifEnabled={notifEnabled}
          onRequestNotifications={handleRequestNotifications}
          onSaveNotifTime={handleSaveNotifTime}
          onSetNotifEnabled={handleSetNotifEnabled}
        />
      )}
    </div>
  );
}
