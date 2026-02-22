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

export default function ClothingAlgo() {
  const envKey = window.__CONFIG__?.PIRATE_WEATHER_API_KEY || import.meta.env.VITE_PIRATE_WEATHER_API_KEY || "";
  const [apiKey, setApiKey] = useState(envKey);
  const [keyInput, setKeyInput] = useState("");
  const [personalAdj, setPersonalAdj] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(null); // null=loading, true/false
  const [defaultLocPref, setDefaultLocPref] = useState(null);
  const [view, setView] = useState("today");

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
    notifPermission, notifTime,
    showTimePicker, setShowTimePicker,
    handleRequestNotifications, handleSaveNotifTime,
  } = useNotifications({ weatherData, personalAdj, apiKey, lat, lng });

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
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
              Florida Comfort Index
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", letterSpacing: -0.5 }}>
              Clothing Algorithm
            </div>
            <div style={{ width: 40, height: 2, background: "#f97316", marginTop: 8 }} />
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
          <ApiKeyEntry keyInput={keyInput} onKeyInputChange={setKeyInput} onSaveKey={handleSaveKey} />
        ) : (
          <>
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

            <PersonalAdjSlider value={personalAdj} onChange={setPersonalAdj} />
            <ViewSwitcher view={view} onViewChange={setView} />
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
      {showSettings && (
        <SettingsModal
          homeLocation={homeLocation}
          defaultLocPref={defaultLocPref || "gps"}
          onSave={handleSaveHome}
          onSaveDefaultLocPref={handleSaveDefaultLocPref}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
