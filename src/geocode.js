function formatLocationLabel(item) {
  const address = item?.address || {};
  const city = address.city || address.town || address.village || address.hamlet || address.county;
  const state = address.state || address.region;
  const country = address.country;

  if (city && state) return `${city}, ${state}`;
  if (city && country) return `${city}, ${country}`;
  if (state && country) return `${state}, ${country}`;
  return item?.display_name?.split(",").slice(0, 2).join(",").trim() || "Unknown Location";
}

export async function searchCity(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => ({
        name: formatLocationLabel(item),
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  } catch (_) {
    return [];
  }
}

export async function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return formatLocationLabel(data);
  } catch (_) {
    return null;
  }
}
