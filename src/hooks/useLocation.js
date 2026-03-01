import { useState, useMemo, useEffect, useRef } from "react";
import { DEFAULT_HOME, PRESET_LOCATIONS } from "../constants.js";
import { reverseGeocode } from "../geocode.js";

const USER_SAVED_LOCATIONS_KEY = "dressindex_saved_locations";
const HIDDEN_PRESET_LOCATIONS_KEY = "dressindex_hidden_preset_locations";
const MAX_USER_SAVED_LOCATIONS = 10;

function normalizeLocation(loc) {
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  const name = typeof loc?.name === "string" ? loc.name.trim() : "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !name) return null;

  const roundedLat = Number(lat.toFixed(4));
  const roundedLng = Number(lng.toFixed(4));
  const label = typeof loc?.label === "string" && loc.label.trim()
    ? loc.label.trim()
    : name.split(",")[0].trim() || name;

  return { label, name, lat: roundedLat, lng: roundedLng };
}

function locationKey(loc) {
  return `${Number(loc.lat).toFixed(4)},${Number(loc.lng).toFixed(4)}`;
}

function dedupeLocations(list, limit = Infinity) {
  const deduped = [];
  const seen = new Set();

  for (const item of list) {
    const normalized = normalizeLocation(item);
    if (!normalized) continue;
    const key = locationKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(normalized);
    if (deduped.length >= limit) break;
  }

  return deduped;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  const unique = [];
  const seen = new Set();

  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }

  return unique;
}

export default function useLocation(defaultLocationPref) {
  const [homeLocation, setHomeLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("dressindex_home");
      return saved ? JSON.parse(saved) : DEFAULT_HOME;
    } catch { return DEFAULT_HOME; }
  });
  const [userSavedLocations, setUserSavedLocations] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_SAVED_LOCATIONS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? dedupeLocations(parsed, MAX_USER_SAVED_LOCATIONS) : [];
    } catch {
      return [];
    }
  });
  const [hiddenPresetLocationKeys, setHiddenPresetLocationKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(HIDDEN_PRESET_LOCATIONS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return normalizeStringArray(parsed);
    } catch {
      return [];
    }
  });
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [locationSource, setLocationSource] = useState(null); // "gps" | "named"
  const [locating, setLocating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const geoRequestId = useRef(0);

  const applyLocation = (loc) => {
    const normalized = normalizeLocation(loc);
    if (!normalized) return false;
    geoRequestId.current += 1; // invalidate any in-flight GPS request
    setLocating(false);
    setLat(normalized.lat);
    setLng(normalized.lng);
    setLocationName(normalized.name);
    setLocationSource("named");
    return true;
  };

  const applyGpsLocation = async (latitude, longitude) => {
    const roundedLat = Number(latitude.toFixed(4));
    const roundedLng = Number(longitude.toFixed(4));
    setLat(roundedLat);
    setLng(roundedLng);
    setLocationSource("gps");
    const cityName = await reverseGeocode(roundedLat, roundedLng);
    setLocationName(cityName || "Current Location");
  };

  const updateUserSavedLocations = (updater) => {
    setUserSavedLocations((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(USER_SAVED_LOCATIONS_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable - keep state only
      }
      return next;
    });
  };

  const updateHiddenPresetLocationKeys = (updater) => {
    setHiddenPresetLocationKeys((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeStringArray(nextRaw);
      try {
        localStorage.setItem(HIDDEN_PRESET_LOCATIONS_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable - keep state only
      }
      return next;
    });
  };

  const presetLocationKeys = useMemo(() => {
    return new Set(PRESET_LOCATIONS.map((loc) => locationKey(loc)));
  }, []);

  const visiblePresetLocations = useMemo(() => {
    const hidden = new Set(hiddenPresetLocationKeys);
    return PRESET_LOCATIONS.filter((loc) => !hidden.has(locationKey(loc)));
  }, [hiddenPresetLocationKeys]);

  const savedLocations = useMemo(() => {
    return dedupeLocations([
      ...userSavedLocations,
      ...visiblePresetLocations,
    ]);
  }, [userSavedLocations, visiblePresetLocations]);

  // Initialize location once startup preference is known.
  useEffect(() => {
    if (defaultLocationPref == null) return;

    if (defaultLocationPref === "home") {
      setLat(homeLocation.lat);
      setLng(homeLocation.lng);
      setLocationName(homeLocation.name);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyGpsLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLat(homeLocation.lat);
          setLng(homeLocation.lng);
          setLocationName(homeLocation.name);
          setLocationSource("named");
        },
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
      );
    } else {
      setLat(homeLocation.lat);
      setLng(homeLocation.lng);
      setLocationName(homeLocation.name);
      setLocationSource("named");
    }
  }, [defaultLocationPref]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeolocate = (setError) => {
    if (!navigator.geolocation) return;
    const prevName = locationName;
    const prevSource = locationSource;
    setError("");
    setLocating(true);
    setLocationName("Locating...");
    setLocationSource("gps");
    geoRequestId.current += 1;
    const requestId = geoRequestId.current;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (geoRequestId.current !== requestId) return;
        setLocating(false);
        setError("");
        applyGpsLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        if (geoRequestId.current !== requestId) return;
        setLocating(false);
        setLocationName(prevName);
        setLocationSource(prevSource);
        setError("Unable to get location. Please check your browser permissions.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
    );
  };

  const handleSaveHome = (home) => {
    setHomeLocation(home);
    localStorage.setItem("dressindex_home", JSON.stringify(home));
    setShowSettings(false);
  };

  const selectHomeLocation = () => {
    applyLocation({
      label: "Home",
      name: homeLocation.name,
      lat: homeLocation.lat,
      lng: homeLocation.lng,
    });
  };

  const selectLocation = (loc) => {
    applyLocation(loc);
  };

  const selectTemporaryLocation = (loc) => {
    applyLocation(loc);
  };

  const saveCustomLocation = (loc) => {
    const normalized = normalizeLocation(loc);
    if (!normalized) return;
    applyLocation(normalized);
    updateUserSavedLocations((prev) => dedupeLocations([normalized, ...prev], MAX_USER_SAVED_LOCATIONS));
  };

  const removeSavedLocation = (loc) => {
    const normalized = normalizeLocation(loc);
    if (!normalized) return;
    const targetKey = locationKey(normalized);
    updateUserSavedLocations((prev) => prev.filter((item) => locationKey(item) !== targetKey));
    if (presetLocationKeys.has(targetKey)) {
      updateHiddenPresetLocationKeys((prev) => {
        if (prev.includes(targetKey)) return prev;
        return [...prev, targetKey];
      });
    }
  };

  return {
    homeLocation, lat, lng, locationName, locationSource, locating,
    showSettings, setShowSettings,
    savedLocations,
    handleGeolocate, handleSaveHome,
    selectHomeLocation, selectLocation,
    selectTemporaryLocation, saveCustomLocation, removeSavedLocation,
  };
}
