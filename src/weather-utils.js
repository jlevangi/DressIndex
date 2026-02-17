export function getWindMod(speed) {
  if (speed <= 10) return 0;
  if (speed <= 15) return -2;
  if (speed <= 20) return -4;
  return -6;
}

export function getSkyMod(cloudCover) {
  if (cloudCover < 0.3) return 0;
  if (cloudCover < 0.7) return -1.5;
  return -3;
}

export function getPrecipMod(intensity) {
  if (!intensity || intensity < 0.01) return 0;
  if (intensity < 0.1) return -2;
  return -4;
}

export function getTimeMod(timestamp, sunsetTime) {
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

export function dewPointMod(dp) {
  if (dp >= 65) return 3;
  if (dp >= 60) return 2;
  if (dp >= 55) return 1;
  return 0;
}

export function computeEffective(data, personalAdj, sunsetTime) {
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

export function getClothing(eff) {
  let top, bottom, color;
  if (eff >= 72) { top = "T-Shirt"; bottom = "Shorts"; color = "#22c55e"; }
  else if (eff >= 66) { top = "Crew Neck"; bottom = "Shorts"; color = "#eab308"; }
  else if (eff >= 58) { top = "Hoodie"; bottom = "Shorts"; color = "#f97316"; }
  else { top = "Jacket"; bottom = "Pants"; color = "#ef4444"; }
  return { top, bottom, color };
}

/**
 * Scan hourly data from startHour through 11 PM, find the coldest effective
 * temperature, and return the clothing recommendation that covers the whole day.
 */
export function getDayRecommendation(hourlyData, personalAdj, sunsetTime, startHour = 6) {
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

  for (const h of relevant) {
    const calc = computeEffective(h, personalAdj, sunsetTime);
    if (calc.effective < coldestEff) {
      coldestEff = calc.effective;
      coldestHour = h;
    }
  }

  const clothing = getClothing(coldestEff);
  return {
    coldestEffective: coldestEff,
    coldestHour,
    clothing,
  };
}
