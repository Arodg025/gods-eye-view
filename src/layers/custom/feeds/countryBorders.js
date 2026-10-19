/**
 * Country borders — Natural Earth admin-0 boundaries already bundled with the
 * app (src/data/local_data/natural_earth/countries.json, public domain),
 * drawn as ground-clamped polylines with a name label at each country's
 * centroid. No network beyond the bundled file; no key.
 */
import { decodeRing } from '../../../data/adminBoundaries.js';
import { attachCustomHoverInfo } from '../index.js';

const COUNTRIES_URL = new URL(
  '../../../data/local_data/natural_earth/countries.json',
  import.meta.url,
).href;

function validRing(ring) {
  // The curated pack has corrupt values for a few sub-km² features
  // (e.g. Vatican); drop any ring with out-of-range coordinates so they
  // never draw stray lines across the globe.
  for (const [lon, lat] of ring) {
    if (
      !Number.isFinite(lon) ||
      !Number.isFinite(lat) ||
      Math.abs(lon) > 180 ||
      Math.abs(lat) > 90
    )
      return false;
  }
  return ring.length >= 2;
}

function ringCentroid(ring) {
  let x = 0;
  let y = 0;
  for (const [lon, lat] of ring) {
    x += lon;
    y += lat;
  }
  return ring.length ? [x / ring.length, y / ring.length] : null;
}

export const countryBordersFeed = {
  id: 'custom-country-borders',
  name: 'Country Borders',
  icon: '🗺️',
  source: 'Natural Earth',
  updateInterval: 30 * 24 * 3600_000,
  colorCss: '#8fa8bf',

  async fetchRows(signal) {
    const res = await fetch(COUNTRIES_URL, { signal });
    if (!res.ok) throw new Error(`Country borders ${res.status}`);
    const pack = await res.json();
    const decimals = pack?.meta?.decimals ?? 3;
    return (pack.features || [])
      .filter((f) => f?.name && Array.isArray(f.polygons))
      .map((f) => ({
        id: f.iso || f.name,
        title: f.name,
        details: [
          { label: 'ISO', value: f.iso || '—' },
          { label: 'Source', value: 'Natural Earth' },
        ],
        polygons: f.polygons,
        decimals,
      }));
  },

  renderRows(Cesium, rows, dataSource, feed) {
    const lineColor = Cesium.Color.fromCssColorString(
      feed.colorCss || '#8fa8bf',
    );
    for (const row of rows) {
      let best = null;
      let bestLen = 0;
      let ringIndex = 0;
      for (const poly of row.polygons || []) {
        for (const encoded of poly) {
          const ring = decodeRing(encoded, row.decimals);
          if (!validRing(ring)) continue;
          const positions = ring.map(([lon, lat]) =>
            Cesium.Cartesian3.fromDegrees(lon, lat),
          );
          positions.push(positions[0].clone());
          // Ground-clamped polylines are depth-tested, so borders hide
          // behind the globe like the other surface layers.
          dataSource.entities.add(
            new Cesium.Entity({
              id: `${feed.id}:${row.id}:ring-${ringIndex++}`,
              polyline: {
                positions,
                width: 1.5,
                material: lineColor,
                clampToGround: true,
              },
            }),
          );
          if (ring.length > bestLen) {
            bestLen = ring.length;
            best = ring;
          }
        }
      }
      const center = best ? ringCentroid(best) : null;
      if (!center) continue;
      const labelEntity = new Cesium.Entity({
        id: `${feed.id}:${row.id}`,
        position: Cesium.Cartesian3.fromDegrees(center[0], center[1]),
        label: {
          text: row.title,
          font: '11px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: 0,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            12_000_000,
          ),
        },
      });
      attachCustomHoverInfo(labelEntity, feed, {
        title: row.title,
        subtitle: 'Country',
        details: row.details,
      });
      dataSource.entities.add(labelEntity);
    }
    return Cesium.JulianDate.now();
  },
};
