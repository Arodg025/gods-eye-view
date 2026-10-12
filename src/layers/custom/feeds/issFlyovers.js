/**
 * ISS flyovers — next visible passes over the observer.
 * TLE from CelesTrak (free, keyless); SGP4 via satellite.js (already a dep);
 * pass math via the repo's own satellitePass.js.
 */

import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';
import { findNextSatellitePass } from '../../../data/satellitePass.js';

const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
// Observer: Adam's area. Easy to change.
const OBSERVER = { lat: 49.19, lon: -122.85, name: 'Surrey, BC' };
const R2D = 180 / Math.PI;

function subpointAt(satrec, ms) {
  const pv = propagate(satrec, new Date(ms));
  if (!pv?.position) return null;
  const geo = eciToGeodetic(pv.position, gstime(new Date(ms)));
  return {
    lat: geo.latitude * R2D,
    lon: (((geo.longitude * R2D + 540) % 360) - 180),
  };
}

function fmtTime(ms) {
  return new Date(ms).toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const issFlyoversFeed = {
  id: 'custom-iss-flyovers',
  name: 'ISS Flyovers',
  icon: '🛰️',
  source: 'CelesTrak',
  updateInterval: 60 * 60_000,
  colorCss: '#ffffff',

  async fetchRows(signal) {
    const res = await fetch(TLE_URL, { signal });
    if (!res.ok) throw new Error(`CelesTrak ${res.status}`);
    const lines = (await res.text()).trim().split('\n');
    const satrec = twoline2satrec(lines[1].trim(), lines[2].trim());

    const now = Date.now();
    const rows = [];

    // Current position.
    const here = subpointAt(satrec, now);
    if (here) {
      rows.push({
        id: 'iss-now',
        lon: here.lon,
        lat: here.lat,
        title: '🛰️ ISS (now)',
        subtitle: 'Live position',
        pointSize: 12,
        colorCss: '#ffffff',
      });
    }

    // Next 3 passes over the observer.
    let fromMs = now;
    for (let i = 0; i < 3; i++) {
      const pass = findNextSatellitePass({
        satrec,
        latDeg: OBSERVER.lat,
        lonDeg: OBSERVER.lon,
        fromMs,
        minElevDeg: 10,
        horizonHours: 48,
      });
      if (!pass) break;
      const peak = subpointAt(satrec, pass.maxElevMs);
      if (peak) {
        rows.push({
          id: `iss-pass-${i}`,
          lon: peak.lon,
          lat: peak.lat,
          title: `🛰️ ISS pass ${i + 1}`,
          subtitle:
            `${fmtTime(pass.maxElevMs)} over ${OBSERVER.name} · ` +
            `max ${Math.round(pass.maxElevDeg)}°${pass.visible ? ' · visible' : ''}`,
          pointSize: 10,
          colorCss: pass.visible ? '#7dff8a' : '#9db8d2',
        });
      }
      fromMs = pass.setMs + 60_000;
    }
    return rows;
  },
};
