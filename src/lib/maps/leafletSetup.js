/* ════════════════════════════════════════════════════════════
   Leaflet default-marker icon fix. (The region normalizer that used to be
   merged into this file is now lib/maps/regions.js — keeping it here made every
   page that needed a region name load all of Leaflet.)
   ════════════════════════════════════════════════════════════ */

/*
 * Leaflet default-marker icon fix — using BUNDLED images.
 *
 * Leaflet's default `L.Icon.Default` resolves its marker PNGs against a guessed
 * path (relative to the leaflet CSS URL, or `L.Icon.Default.imagePath`). Under a
 * bundler that guess is wrong, and inside a Capacitor WebView (capacitor://
 * origin) it 404s outright — so any react-leaflet <Marker> without a custom icon
 * renders as a broken image on mobile.
 *
 * Importing the images through Vite turns them into app-origin assets that
 * resolve identically on the web and on capacitor://. Import this module for
 * its side effect at the top of every file that renders a Leaflet map (not
 * eagerly in src/main.jsx) — that keeps leaflet out of the main entry chunk
 * for users who never open a map, while ES module caching means the fix still
 * only runs once no matter how many map files import it. Maps that pass their
 * own custom icon are unaffected; this only fixes the default marker.
 */

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
