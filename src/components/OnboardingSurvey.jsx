import { useState } from "react";
import { setConfig } from "../idb-config.js";
import { ONBOARDING_QUESTIONS } from "../constants.js";
import { searchCity, reverseGeocode } from "../geocode.js";

const QUESTION_COUNT = ONBOARDING_QUESTIONS.length;
const HOME_STEP = QUESTION_COUNT;
const RESULT_STEP = QUESTION_COUNT + 1;
const TOTAL_DOTS = RESULT_STEP + 1;

export default function OnboardingSurvey({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTION_COUNT).fill(null));
  const [homeChoice, setHomeChoice] = useState(null);
  const [homeSet, setHomeSet] = useState(false);
  const [defaultPref, setDefaultPref] = useState("gps");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const totalAdj = answers.reduce((sum, a) => sum + (a ?? 0), 0);

  const handleSelect = (points) => {
    const next = [...answers];
    next[step] = points;
    setAnswers(next);
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSearch = async () => {
    setSearchError("");
    setSearchResults([]);
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError("Enter at least 2 characters.");
      return;
    }

    setSearching(true);
    const results = await searchCity(query);
    setSearching(false);
    setSearchResults(results);
    if (!results.length) {
      setSearchError("No results found.");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation unavailable.");
      return;
    }
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(4);
        const lng = +pos.coords.longitude.toFixed(4);
        const name = (await reverseGeocode(lat, lng)) || "Current Location";
        setHomeChoice({ name, lat, lng });
      },
      () => setSearchError("Unable to read GPS location.")
    );
  };

  const handleContinueHome = () => {
    if (homeChoice) {
      setHomeSet(true);
    } else {
      setHomeSet(false);
      setDefaultPref("gps");
    }
    setStep(RESULT_STEP);
  };

  const handleSkipHome = () => {
    setHomeChoice(null);
    setHomeSet(false);
    setDefaultPref("gps");
    setStep(RESULT_STEP);
  };

  const handleComplete = async () => {
    const resolvedDefaultPref = homeSet ? defaultPref : "gps";
    const answersObj = {};
    for (let i = 0; i < QUESTION_COUNT; i++) {
      answersObj[`q${i + 1}`] = answers[i];
    }
    try {
      await setConfig("onboardingComplete", true);
      await setConfig("personalAdj", totalAdj);
      await setConfig("onboardingAnswers", answersObj);
      await setConfig("defaultLocationPref", resolvedDefaultPref);
    } catch (_) {
      // IndexedDB failed — proceed anyway
    }
    onComplete(totalAdj, homeSet ? homeChoice : null, resolvedDefaultPref);
  };

  const adjLabel = totalAdj > 0
    ? "You tend to run warm \u2014 we'll nudge recommendations lighter."
    : totalAdj < 0
    ? "You tend to run cold \u2014 we'll nudge recommendations warmer."
    : "You're right in the middle \u2014 standard recommendations for you.";

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
          {Array.from({ length: TOTAL_DOTS }, (_, i) => (
            <div key={i} style={{
              width: i <= step ? 24 : 8, height: 4, borderRadius: 2,
              background: i <= step ? "#f97316" : "#333",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {step < QUESTION_COUNT ? (
          <>
            <div style={{
              fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase",
              marginBottom: 8, textAlign: "center",
            }}>
              Question {step + 1} of {QUESTION_COUNT}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600, color: "#f0f0f0", textAlign: "center",
              marginBottom: 32, lineHeight: 1.4,
            }}>
              {ONBOARDING_QUESTIONS[step].question}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ONBOARDING_QUESTIONS[step].answers.map((ans) => {
                const isSelected = answers[step] === ans.points;
                return (
                  <button
                    key={ans.label}
                    onClick={() => handleSelect(ans.points)}
                    style={{
                      padding: "14px 20px", fontSize: 14, fontFamily: "inherit", fontWeight: 500,
                      background: isSelected ? "rgba(249,115,22,0.15)" : "#111",
                      border: isSelected ? "1px solid #f97316" : "1px solid #1a1a1a",
                      borderRadius: 8, color: isSelected ? "#f97316" : "#ccc",
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {ans.label}
                  </button>
                );
              })}
            </div>
            {step > 0 && (
              <button
                onClick={handleBack}
                style={{
                  marginTop: 20, background: "transparent", border: "none",
                  color: "#555", fontSize: 12, fontFamily: "inherit",
                  cursor: "pointer", padding: "8px 0",
                }}
              >
                Back
              </button>
            )}
          </>
        ) : step === HOME_STEP ? (
          <>
            <div style={{
              fontSize: 11, color: "#f97316", letterSpacing: 3, textTransform: "uppercase",
              marginBottom: 8, textAlign: "center", fontWeight: 700,
            }}>
              Optional
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600, color: "#f0f0f0", textAlign: "center",
              marginBottom: 8,
            }}>
              Set Your Home Location
            </div>
            <div style={{
              fontSize: 12, color: "#777", textAlign: "center",
              marginBottom: 20, lineHeight: 1.5,
            }}>
              Used as your fallback when GPS is unavailable.
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city"
                style={{
                  flex: 1, padding: "10px 12px", background: "#111", border: "1px solid #1a1a1a",
                  borderRadius: 8, color: "#e0e0e0", fontFamily: "inherit", fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                style={{
                  background: "transparent", border: "1px solid #333", borderRadius: 8,
                  color: searching ? "#444" : "#ccc", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                  padding: "10px 12px", cursor: searching ? "default" : "pointer",
                }}
              >
                {searching ? "..." : "Search"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {searchResults.map((result) => {
                  const isSelected = homeChoice?.lat === result.lat && homeChoice?.lng === result.lng;
                  return (
                    <button
                      key={`${result.name}:${result.lat}:${result.lng}`}
                      onClick={() => setHomeChoice(result)}
                      style={{
                        padding: "10px 14px",
                        fontSize: 13,
                        fontFamily: "inherit",
                        fontWeight: 500,
                        background: isSelected ? "rgba(249,115,22,0.15)" : "#111",
                        border: isSelected ? "1px solid #f97316" : "1px solid #1a1a1a",
                        borderRadius: 8,
                        color: isSelected ? "#f97316" : "#ccc",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {result.name}
                    </button>
                  );
                })}
              </div>
            )}

            {searchError && (
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>
                {searchError}
              </div>
            )}

            <button
              onClick={handleUseCurrentLocation}
              style={{
                marginBottom: 12, background: "transparent", border: "1px solid #333", borderRadius: 8,
                color: "#888", fontSize: 12, fontFamily: "inherit", cursor: "pointer", padding: "8px 10px",
              }}
            >
              Use Current Location
            </button>

            {homeChoice && (
              <div style={{
                background: "#111", border: "1px solid #1a1a1a", borderRadius: 8,
                padding: 12, marginBottom: 12,
              }}>
                <div style={{ fontSize: 11, color: "#22c55e", marginBottom: 4 }}>
                  {"\u2713"} Selected
                </div>
                <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 600 }}>
                  {homeChoice.name}
                </div>
              </div>
            )}

            <label style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
              color: homeChoice ? "#ccc" : "#666", fontSize: 12,
            }}>
              <input
                type="checkbox"
                checked={defaultPref === "home"}
                disabled={!homeChoice}
                onChange={(e) => setDefaultPref(e.target.checked ? "home" : "gps")}
              />
              Use Home as default on startup
            </label>

            <button
              onClick={handleContinueHome}
              style={{
                width: "100%", padding: "14px 20px", fontSize: 14, fontFamily: "inherit",
                fontWeight: 600, background: "#f97316", color: "#000", border: "none",
                borderRadius: 8, cursor: "pointer",
              }}
            >
              Continue
            </button>
            <button
              onClick={handleSkipHome}
              style={{
                width: "100%", marginTop: 10, background: "transparent", border: "none",
                color: "#666", fontSize: 12, fontFamily: "inherit", cursor: "pointer", padding: "8px 0",
              }}
            >
              Skip
            </button>
            <button
              onClick={handleBack}
              style={{
                width: "100%", marginTop: 4, background: "transparent", border: "none",
                color: "#555", fontSize: 12, fontFamily: "inherit", cursor: "pointer", padding: "8px 0",
              }}
            >
              Back
            </button>
          </>
        ) : (
          <>
            <div style={{
              fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase",
              marginBottom: 8, textAlign: "center",
            }}>
              Your Profile
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600, color: "#f0f0f0", textAlign: "center",
              marginBottom: 12,
            }}>
              Personal Adjustment
            </div>
            <div style={{
              fontSize: 48, fontWeight: 700, color: "#f97316", textAlign: "center",
              marginBottom: 8,
            }}>
              {totalAdj > 0 ? "+" : ""}{totalAdj}&deg;F
            </div>
            <div style={{
              fontSize: 13, color: "#888", textAlign: "center",
              marginBottom: 32, lineHeight: 1.5, maxWidth: 320, margin: "0 auto 32px",
            }}>
              {adjLabel}
            </div>
            <div style={{
              background: "#111", border: "1px solid #1a1a1a", borderRadius: 8,
              padding: 16, marginBottom: 24,
            }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Your answers:</div>
              {ONBOARDING_QUESTIONS.map((q, i) => {
                const selected = q.answers.find((a) => a.points === answers[i]);
                return (
                  <div key={i} style={{
                    fontSize: 12, color: "#888", marginBottom: 4, lineHeight: 1.5,
                  }}>
                    <span style={{ color: "#555" }}>{i + 1}.</span> {selected?.label}
                    <span style={{ color: "#f97316", marginLeft: 6 }}>
                      {answers[i] > 0 ? "+" : ""}{answers[i]}
                    </span>
                  </div>
                );
              })}
              {homeSet && homeChoice && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 8, lineHeight: 1.5 }}>
                  <span style={{ color: "#555" }}>Home:</span> {homeChoice.name}
                </div>
              )}
            </div>
            <button
              onClick={handleComplete}
              style={{
                width: "100%", padding: "14px 20px", fontSize: 14, fontFamily: "inherit",
                fontWeight: 600, background: "#f97316", color: "#000", border: "none",
                borderRadius: 8, cursor: "pointer",
              }}
            >
              Get Started
            </button>
            <button
              onClick={handleBack}
              style={{
                width: "100%", marginTop: 10, background: "transparent", border: "none",
                color: "#555", fontSize: 12, fontFamily: "inherit",
                cursor: "pointer", padding: "8px 0",
              }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
