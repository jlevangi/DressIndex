import { useState } from "react";
import { setConfig } from "../idb-config.js";
import { ONBOARDING_QUESTIONS } from "../constants.js";

export default function OnboardingSurvey({ onComplete }) {
  const [step, setStep] = useState(0); // 0-2 = questions, 3 = result
  const [answers, setAnswers] = useState([null, null, null]);

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

  const handleComplete = async () => {
    try {
      await setConfig("onboardingComplete", true);
      await setConfig("personalAdj", totalAdj);
      await setConfig("onboardingAnswers", {
        q1: answers[0],
        q2: answers[1],
        q3: answers[2],
      });
    } catch (_) {
      // IndexedDB failed — proceed anyway
    }
    onComplete(totalAdj);
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
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: i <= step ? 24 : 8, height: 4, borderRadius: 2,
              background: i <= step ? "#f97316" : "#333",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {step < 3 ? (
          <>
            <div style={{
              fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase",
              marginBottom: 8, textAlign: "center",
            }}>
              Question {step + 1} of 3
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
