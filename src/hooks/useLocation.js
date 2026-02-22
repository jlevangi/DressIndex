import { useState, useMemo, useEffect } from "react";
import { DEFAULT_HOME, PRESET_LOCATIONS } from "../constants.js";

export default function useLocation() {
  const [homeLocation, setHomeLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("dressindex_home");
      return saved ? JSON.parse(saved) : DEFAULT_HOME;
    } catch { return DEFAULT_HOME; }
  });
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const locations = useMemo(() => [
    { label: "Home", lat: homeLocation.lat, lng: homeLocation.lng, name: homeLocation.name },
    ...PRESET_LOCATIONS,
  ], [homeLocation]);

  // Auto-geolocate on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationName("Current Location");
        },
        () => {
          setLat(homeLocation.lat);
          setLng(homeLocation.lng);
          setLocationName(homeLocation.name);
        }
      );
    } else {
      setLat(homeLocation.lat);
      setLng(homeLocation.lng);
      setLocationName(homeLocation.name);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeolocate = (setError) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationName("Current Location");
        },
        () => setError("Geolocation denied.")
      );
    }
  };

  const handleSaveHome = (home) => {
    setHomeLocation(home);
    localStorage.setItem("dressindex_home", JSON.stringify(home));
    setShowSettings(false);
  };

  const selectLocation = (loc) => {
    setLat(loc.lat);
    setLng(loc.lng);
    setLocationName(loc.name);
  };

  return {
    homeLocation, lat, lng, locationName,
    showSettings, setShowSettings,
    locations,
    handleGeolocate, handleSaveHome, selectLocation,
  };
}
