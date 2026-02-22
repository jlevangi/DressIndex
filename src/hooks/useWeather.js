import { useState, useEffect, useCallback, useMemo } from "react";

export default function useWeather(apiKey, lat, lng) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

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

  // Auto-fetch and refresh every 15 min
  useEffect(() => {
    if (!apiKey || lat == null || lng == null) return;
    fetchWeather(apiKey, lat, lng);
    const interval = setInterval(() => fetchWeather(apiKey, lat, lng), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey, lat, lng, fetchWeather]);

  const sunsetTime = weatherData?.daily?.data?.[0]?.sunsetTime || null;
  const tomorrowSunsetTime = weatherData?.daily?.data?.[1]?.sunsetTime || null;
  const currentData = weatherData?.currently || null;

  // 9AM-8PM slice for outfit recommendations
  const hourlySlice = useMemo(() => {
    if (!weatherData?.hourly?.data) return [];
    const startOfDay = new Date();
    startOfDay.setHours(9, 0, 0, 0);
    const startTs = Math.floor(startOfDay.getTime() / 1000);
    const endOfDay = new Date();
    endOfDay.setHours(20, 0, 0, 0);
    const endTs = Math.floor(endOfDay.getTime() / 1000);
    return weatherData.hourly.data.filter((h) => h.time >= startTs && h.time <= endTs);
  }, [weatherData]);

  // 9AM-11PM slice for timeline display
  const todayTimelineSlice = useMemo(() => {
    if (!weatherData?.hourly?.data) return [];
    const startOfDay = new Date();
    startOfDay.setHours(9, 0, 0, 0);
    const startTs = Math.floor(startOfDay.getTime() / 1000);
    const endOfDay = new Date();
    endOfDay.setHours(23, 0, 0, 0);
    const endTs = Math.floor(endOfDay.getTime() / 1000);
    return weatherData.hourly.data.filter((h) => h.time >= startTs && h.time <= endTs);
  }, [weatherData]);

  // 9AM-8PM slice for tomorrow outfit recommendations
  const tomorrowHourlySlice = useMemo(() => {
    if (!weatherData?.hourly?.data) return [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(9, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(20, 0, 0, 0);
    const startTs = Math.floor(startOfTomorrow.getTime() / 1000);
    const endTs = Math.floor(endOfTomorrow.getTime() / 1000);
    return weatherData.hourly.data.filter((h) => h.time >= startTs && h.time <= endTs);
  }, [weatherData]);

  // 9AM-11PM slice for tomorrow timeline display
  const tomorrowTimelineSlice = useMemo(() => {
    if (!weatherData?.hourly?.data) return [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(9, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 0, 0, 0);
    const startTs = Math.floor(startOfTomorrow.getTime() / 1000);
    const endTs = Math.floor(endOfTomorrow.getTime() / 1000);
    return weatherData.hourly.data.filter((h) => h.time >= startTs && h.time <= endTs);
  }, [weatherData]);

  const nowHourTs = useMemo(() => {
    if (!todayTimelineSlice.length) return null;
    const now = Math.floor(Date.now() / 1000);
    let closest = todayTimelineSlice[0];
    for (const h of todayTimelineSlice) {
      if (Math.abs(h.time - now) < Math.abs(closest.time - now)) closest = h;
    }
    return closest.time;
  }, [todayTimelineSlice]);

  return {
    weatherData, setWeatherData,
    loading, error, setError, lastFetch,
    fetchWeather,
    sunsetTime, tomorrowSunsetTime, currentData,
    hourlySlice, todayTimelineSlice, tomorrowHourlySlice, tomorrowTimelineSlice,
    nowHourTs,
  };
}
