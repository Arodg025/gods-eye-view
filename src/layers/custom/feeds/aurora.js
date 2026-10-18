/**
 * Aurora forecast — NOAA SWPC OVATION model.
 * Live, keyless, CORS-enabled. Grid of [lon, lat, probability].
 */

import { attachCustomHoverInfo } from '../index.js';

const OVATION_URL = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';

export const auroraFeed = {
  id: 'custom-aurora',
  name: 'Aurora Forecast',
  icon: '🌌',
  source: 'NOAA SWPC',
  updateInterval: 15 * 60_000,
  colorCss: '#00ff88',

  async fetchRows(signal) {
    const res = await fetch(OVATION_URL, { signal });
    if (!res.ok) throw new Error(`OVATION ${res.status}`);
    const data = await res.json();
    const coords = data.coordinates || [];
    const rows = [];
    // Sample the 1° grid: keep cells with meaningful probability.
    // Threshold is low (5%) so the oval still renders during quiet spells.
    for (let i = 0; i < coords.length; i += 2) {
      const [lon, lat, prob] = coords[i];
      if (prob >= 5) rows.push({ lon, lat, prob });
    }
    return rows;
  },

  renderRows(Cesium, rows, dataSource, feed) {
    for (const row of rows) {
      const intensity = Math.min(1, row.prob / 80);
      const color = Cesium.Color.fromCssColorString(feed.colorCss).withAlpha(
        0.25 + intensity * 0.55,
      );
      const entity = dataSource.entities.add(
        new Cesium.Entity({
          id: `${feed.id}:${row.lon},${row.lat}`,
          position: Cesium.Cartesian3.fromDegrees(row.lon, row.lat),
          ellipse: {
            semiMajorAxis: 60000,
            semiMinorAxis: 60000,
            material: new Cesium.ColorMaterialProperty(color),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          properties: { title: 'Aurora', subtitle: `${row.prob}% probability` },
        }),
      );
      attachCustomHoverInfo(entity, feed, {
        title: 'Aurora',
        subtitle: `${row.prob}% probability`,
        details: [
          { label: 'Probability', value: `${row.prob}%` },
          { label: 'Source', value: 'NOAA SWPC OVATION' },
        ],
      });
    }
  },
};
