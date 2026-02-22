import { useState, useEffect, useCallback } from "react";
import { getDayRecommendation } from "../weather-utils.js";

export default function useNotifications({ weatherData, personalAdj, apiKey, lat, lng }) {
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [notifTime, setNotifTime] = useState(
    () => localStorage.getItem("dressindex_notif_time")
  );
  const [notifEnabled, setNotifEnabled] = useState(() => {
    const saved = localStorage.getItem("dressindex_notif_enabled");
    return saved === null ? true : saved === "true";
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fireClothingNotification = useCallback(() => {
    const sunset = weatherData?.daily?.data?.[0]?.sunsetTime || null;
    const hourlyData = weatherData?.hourly?.data || [];
    const startHour = notifTime ? Number(notifTime.split(":")[0]) : 6;

    let body;
    const rec = getDayRecommendation(hourlyData, personalAdj, sunset, startHour);
    if (rec) {
      body = `${Math.round(rec.coldestEffective)}\u00b0F coldest effective today \u2014 wear a ${rec.clothing.top} + ${rec.clothing.bottom}`;
    } else {
      body = "Open DressIndex to see today's recommendation";
    }

    if (!notifEnabled) return;

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: "DressIndex",
        body,
      });
    } else {
      try {
        new Notification("DressIndex", { body, tag: "daily-clothing", icon: "/appicon.svg" });
      } catch (_) {
        // Notification constructor not available in this context
      }
    }
  }, [weatherData, personalAdj, notifTime, notifEnabled]);

  // Layer 2: Schedule daily notification via setTimeout (fallback while app is open)
  useEffect(() => {
    if (notifPermission !== "granted" || !notifTime || !notifEnabled) return;
    const [h, m] = notifTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    const timerId = setTimeout(() => fireClothingNotification(), delay);
    return () => clearTimeout(timerId);
  }, [notifPermission, notifTime, notifEnabled, fireClothingNotification]);

  // Sync config to IndexedDB so the SW can access it
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !apiKey) return;
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage({
          type: "SYNC_CONFIG",
          config: { notifTime, notifEnabled, apiKey, lat, lng, personalAdj },
        });
      }
    });
  }, [notifTime, notifEnabled, apiKey, lat, lng, personalAdj]);

  // Layer 3: On mount, ask SW to check for missed notification
  useEffect(() => {
    if (!("serviceWorker" in navigator) || notifPermission !== "granted" || !notifTime || !notifEnabled) return;
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage({ type: "CHECK_MISSED_NOTIFICATION" });
      }
    });
  }, [notifPermission, notifTime, notifEnabled]);

  // Re-register periodic sync on mount (browser may have cleared it)
  useEffect(() => {
    if (!("serviceWorker" in navigator) || notifPermission !== "granted" || !notifTime || !notifEnabled) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      if ("periodicSync" in reg) {
        try {
          await reg.periodicSync.register("daily-clothing-check", { minInterval: 60 * 60 * 1000 });
        } catch (_) {
          // Not allowed — Layer 2 handles it
        }
      }
    });
  }, [notifPermission, notifTime, notifEnabled]);

  const handleRequestNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      setNotifEnabled(true);
      localStorage.setItem("dressindex_notif_enabled", "true");
      setShowTimePicker(true);
    }
  };

  const handleSaveNotifTime = async (time) => {
    setNotifTime(time);
    localStorage.setItem("dressindex_notif_time", time);
    setShowTimePicker(false);

    // Register periodic background sync (Layer 1)
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if ("periodicSync" in reg) {
        try {
          await reg.periodicSync.register("daily-clothing-check", { minInterval: 60 * 60 * 1000 });
        } catch (_) {
          // Periodic sync not allowed — Layer 2 setTimeout fallback will handle it
        }
      }
    }

    // Fire a test notification immediately so user gets confirmation
    fireClothingNotification();
  };

  const handleSetNotifEnabled = (enabled) => {
    const normalized = Boolean(enabled);
    setNotifEnabled(normalized);
    localStorage.setItem("dressindex_notif_enabled", normalized ? "true" : "false");
    setShowTimePicker(false);
  };

  return {
    notifPermission, notifTime, notifEnabled,
    showTimePicker, setShowTimePicker,
    handleRequestNotifications, handleSaveNotifTime, handleSetNotifEnabled,
  };
}
