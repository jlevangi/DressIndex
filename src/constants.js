export const DEFAULT_HOME = { name: "Davenport, FL", lat: 28.1614, lng: -81.6137 };

export const PRESET_LOCATIONS = [
  { label: "Disney", lat: 28.3922, lng: -81.5812, name: "Bay Lake, FL" },
  { label: "Orlando", lat: 28.5383, lng: -81.3792, name: "Orlando, FL" },
  { label: "Miami", lat: 25.7617, lng: -80.1918, name: "Miami, FL" },
  { label: "Tampa", lat: 27.9506, lng: -82.4572, name: "Tampa, FL" },
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
    question: "What kind of climate do you live in?",
    answers: [
      { label: "Cold winters (Northeast, Midwest)", points: -1 },
      { label: "Four seasons, mild winters (Mid-Atlantic, Pacific NW)", points: 0 },
      { label: "Warm year-round (Florida, Gulf Coast, SoCal)", points: +1 },
    ],
  },
  {
    question: "It\u2019s 70\u00b0F and breezy with some clouds \u2014 what are you reaching for?",
    answers: [
      { label: "Definitely a jacket", points: -3 },
      { label: "A long sleeve or light layer", points: 0 },
      { label: "Still a t-shirt", points: +2 },
    ],
  },
  {
    question: "When the temperature drops to the 50s, what\u2019s your move?",
    answers: [
      { label: "I\u2019m freezing, bundle me up", points: -2 },
      { label: "Chilly \u2014 I need real layers", points: -1 },
      { label: "A bit cool, light layer works", points: 0 },
      { label: "Barely notice it", points: +2 },
      { label: "Still in shorts and loving it", points: +3 },
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
