export function getWindMod(speed, baseTemp) {
  if (speed <= 10) return 0;
  let raw;
  if (speed <= 15) raw = -2;
  else if (speed <= 20) raw = -4;
  else raw = -6;
  // Scale wind chill by how far below 75°F the base temp is
  const tempFactor = Math.max(0, Math.min(1, (75 - baseTemp) / 25));
  return +(raw * tempFactor).toFixed(1);
}

export function getSkyMod(cloudCover) {
  if (cloudCover < 0.3) return 0;
  if (cloudCover < 0.7) return -1.5;
  return -3;
}

export function getPrecipMod(intensity, probability = 0) {
  if ((!intensity || intensity < 0.01) && probability <= 0.5) return 0;

  let base = 0;
  if (intensity >= 0.1)       base = -4;
  else if (intensity >= 0.01) base = -2;

  // High probability amplifies the effect (sustained rain feels worse)
  if (probability > 0.5) base -= 2;

  return base;
}

export function getUvMod(uvIndex) {
  if (!uvIndex || uvIndex < 3) return 0;
  if (uvIndex < 6) return 1.5;
  if (uvIndex < 9) return 3;
  return 4;
}

export function dewPointMod(dp) {
  if (dp >= 65) return 3;
  if (dp >= 60) return 2;
  if (dp >= 55) return 1;
  return 0;
}

export function computeEffective(data, personalAdj) {
  const baseTemp = data.temperature || 0;
  const wMod = getWindMod(data.windSpeed || 0, baseTemp);
  const sMod = getSkyMod(data.cloudCover || 0);
  const pMod = getPrecipMod(data.precipIntensity, data.precipProbability);
  const uMod = getUvMod(data.uvIndex);
  const dMod = dewPointMod(data.dewPoint || 50);
  const total = wMod + sMod + pMod + uMod + dMod + personalAdj;
  return {
    base: baseTemp,
    effective: baseTemp + total,
    mods: { wind: wMod, sky: sMod, precip: pMod, uv: uMod, dewPt: dMod, personal: personalAdj },
    total,
  };
}

export function getClothing(eff, data = null) {
  let top, bottom, color;
  if (eff >= 85)      { top = "Topless";      bottom = "Speedo"; color = "#ec4899"; }
  else if (eff >= 70) { top = "T-Shirt";      bottom = "Shorts"; color = "#22c55e"; }
  else if (eff >= 64) { top = "Crew Neck";    bottom = "Shorts"; color = "#eab308"; }
  else if (eff >= 58) { top = "Light Jacket"; bottom = "Shorts"; color = "#f97316"; }
  else if (eff >= 54) { top = "Light Jacket"; bottom = "Pants";  color = "#ea580c"; }
  else if (eff >= 38) { top = "Hoodie";       bottom = "Pants";  color = "#ef4444"; }
  else if (eff >= 30) { top = "Medium Coat";  bottom = "Pants";  color = "#3b82f6"; }
  else                { top = "Winter Coat";  bottom = "Pants";  color = "#8b5cf6"; }

  // Significant rain makes shorts impractical regardless of temperature
  if (data && (data.precipProbability || 0) > 0.4 && (data.precipIntensity || 0) > 0.02) {
    if (bottom === "Shorts") bottom = "Pants";
  }

  return { top, bottom, color };
}

export function getAccessoryTags(data, clothing, dayHourlyData, personalAdj) {
  const tags = [];

  // Windbreaker: wind > 15 mph and outfit isn't already jacket/coat/hoodie
  const heavyTops = ["Light Jacket", "Hoodie", "Medium Coat", "Winter Coat"];
  if ((data.windSpeed || 0) > 15 && !heavyTops.includes(clothing.top)) {
    tags.push({ label: "Windbreaker", color: "#3b82f6" });
  }

  // Rain Jacket: precipProbability > 30%
  if ((data.precipProbability || 0) > 0.3) {
    tags.push({ label: "Rain Jacket", color: "#67e8f9" });
  }

  // Umbrella: any hour in the day has precipProbability > 50%
  const hasRainToday = dayHourlyData
    ? dayHourlyData.some((h) => (h.precipProbability || 0) > 0.5)
    : (data.precipProbability || 0) > 0.5;
  if (hasRainToday) {
    tags.push({ label: "Umbrella", color: "#60a5fa" });
  }

  // Sunscreen: UV index >= 6
  if ((data.uvIndex || 0) >= 6) {
    tags.push({ label: "Sunscreen", color: "#facc15" });
  }

  // Bring a Layer: day's max-min effective spread > 10°F (only if dayHourlyData provided)
  if (dayHourlyData && dayHourlyData.length > 1) {
    let minEff = Infinity;
    let maxEff = -Infinity;
    for (const h of dayHourlyData) {
      const calc = computeEffective(h, personalAdj);
      if (calc.effective < minEff) minEff = calc.effective;
      if (calc.effective > maxEff) maxEff = calc.effective;
    }
    if (maxEff - minEff > 10) {
      tags.push({ label: "Bring a Layer", color: "#a78bfa" });
    }
  }

  return tags;
}

/**
 * Scan hourly data from startHour through 11 PM, find the coldest effective
 * temperature, and return the clothing recommendation that covers the whole day.
 */
export function getDayRecommendation(hourlyData, personalAdj, startHour = 6) {
  if (!hourlyData || !hourlyData.length) return null;

  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(startHour, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 0, 0, 0);

  const startTs = Math.floor(dayStart.getTime() / 1000);
  const endTs = Math.floor(dayEnd.getTime() / 1000);

  const relevant = hourlyData.filter((h) => h.time >= startTs && h.time <= endTs);
  if (!relevant.length) return null;

  let coldestEff = Infinity;
  let coldestHour = null;

  const tenPM = new Date(today);
  tenPM.setHours(22, 0, 0, 0);
  const tenPMTs = Math.floor(tenPM.getTime() / 1000);
  let needsPants = false;

  for (const h of relevant) {
    const calc = computeEffective(h, personalAdj);
    if (calc.effective < coldestEff) {
      coldestEff = calc.effective;
      coldestHour = h;
    }
    if (h.time < tenPMTs && calc.effective < 58) {
      needsPants = true;
    }
  }

  const clothing = getClothing(coldestEff, coldestHour);
  if (needsPants) clothing.bottom = "Pants";

  // Compute accessory tags for the coldest hour using all relevant hours
  const tags = getAccessoryTags(coldestHour, clothing, relevant, personalAdj);

  return {
    coldestEffective: coldestEff,
    coldestHour,
    clothing,
    tags,
  };
}
