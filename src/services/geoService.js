/**
 * Dig In Geolocation Service
 * Pure utilities — no DOM access. React components own all rendering.
 *
 * Device access goes through the platform seam (src/lib/native.js) so the
 * eventual Capacitor swap happens in one place.
 */

import { getCurrentPosition } from '../lib/native';

export function getUserLocation() {
  return getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function saveLocation(lat, lng) {
  localStorage.setItem('userLocation', JSON.stringify({ lat, lng, savedAt: new Date().toISOString() }));
}

export function loadLocation() {
  try {
    return JSON.parse(localStorage.getItem('userLocation')) || null;
  } catch {
    return null;
  }
}

export async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
