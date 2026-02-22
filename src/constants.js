export const DEFAULT_HOME = { name: "Davenport, FL", lat: 28.1614, lng: -81.6137 };

export const PRESET_LOCATIONS = [
  { label: "Disney", lat: 28.3922, lng: -81.5812, name: "Bay Lake, FL" },
  { label: "Orlando", lat: 28.5383, lng: -81.3792, name: "Orlando, FL" },
  { label: "Miami", lat: 25.7617, lng: -80.1918, name: "Miami, FL" },
  { label: "Tampa", lat: 27.9506, lng: -82.4572, name: "Tampa, FL" },
  { label: "Cincinnati", lat: 39.1031, lng: -84.5120, name: "Cincinnati, OH" },
];

export const ONBOARDING_QUESTIONS = [
  {
    question: "How does your body handle temperatures?",
    answers: [
      { label: "Always cold", points: -2 },
      { label: "Average", points: 0 },
      { label: "Run hot", points: +2 },
    ],
  },
  {
    question: "Typical outdoor activity level?",
    answers: [
      { label: "Standing / sitting", points: -1 },
      { label: "Light walking", points: 0 },
      { label: "Active (running, hiking)", points: +1 },
    ],
  },
  {
    question: "How used to warm weather are you?",
    answers: [
      { label: "Visiting from cooler climate", points: -1 },
      { label: "1–3 years in warm weather", points: 0 },
      { label: "Florida local 3+ years", points: +1 },
    ],
  },
];

export const TIER_MAP = [
  { label: "Topless + Speedo", range: "\u2265 85\u00b0F", min: 85, max: Infinity, color: "#ec4899" },
  { label: "T-Shirt + Shorts", range: "70 \u2013 85\u00b0F", min: 70, max: 85, color: "#22c55e" },
  { label: "Crew Neck + Shorts", range: "64 \u2013 70\u00b0F", min: 64, max: 70, color: "#eab308" },
  { label: "Light Jacket + Shorts", range: "58 \u2013 64\u00b0F", min: 58, max: 64, color: "#f97316" },
  { label: "Light Jacket + Pants", range: "54 \u2013 58\u00b0F", min: 54, max: 58, color: "#ea580c" },
  { label: "Hoodie + Pants", range: "38 \u2013 54\u00b0F", min: 38, max: 54, color: "#ef4444" },
  { label: "Medium Coat + Pants", range: "30 \u2013 38\u00b0F", min: 30, max: 38, color: "#3b82f6" },
  { label: "Winter Coat + Pants", range: "< 30\u00b0F", min: -Infinity, max: 30, color: "#8b5cf6" },
];
