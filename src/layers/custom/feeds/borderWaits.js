/**
 * Border wait times — US CBP official feed (free, keyless).
 * Curated major crossings with coordinates (the CBP feed has no lat/lon).
 */

const BWT_URL = 'https://bwt.cbp.gov/api/bwtnew';

// port_number -> coordinates for crossings we display (verified Oct 2026).
const PORTS = {
  '300402': { name: 'Peace Arch / Blaine', lon: -122.75, lat: 49.0 },
  '300401': { name: 'Pacific Highway', lon: -122.735, lat: 49.002 },
  '302301': { name: 'Lynden / Aldergrove', lon: -122.483, lat: 49.002 },
  '300901': { name: 'Sumas / Abbotsford', lon: -122.265, lat: 49.002 },
  '331001': { name: 'Sweetgrass, MT', lon: -112.0, lat: 49.0 },
  '380002': { name: 'Detroit / Windsor Tunnel', lon: -83.04, lat: 42.327 },
  '380001': { name: 'Ambassador Bridge', lon: -83.07, lat: 42.31 },
  '380201': { name: 'Port Huron / Blue Water Bridge', lon: -82.43, lat: 42.99 },
  '071201': { name: 'Champlain, NY', lon: -73.45, lat: 45.0 },
  '090102': { name: 'Niagara Falls / Rainbow Bridge', lon: -79.07, lat: 43.09 },
  '090103': { name: 'Niagara Falls / Whirlpool', lon: -79.06, lat: 43.11 },
  '090101': { name: 'San Ysidro', lon: -117.03, lat: 32.55 },
  '240201': { name: 'El Paso / Bridge of the Americas', lon: -106.45, lat: 31.77 },
  '230401': { name: 'Laredo / Bridge I', lon: -99.5, lat: 27.5 },
  '260401': { name: 'Nogales / Deconcini', lon: -110.94, lat: 31.33 },
};

/** One detail line for a single lane object — null when the feed reports nothing usable. */
function laneDetail(lane, label) {
  if (!lane) return null;
  const status = (lane.operational_status || '').trim();
  const delay = parseInt(lane.delay_minutes, 10);
  const mins = Number.isFinite(delay) ? delay : null;
  if (mins == null && (!status || status === 'N/A')) return null;
  let value = mins == null ? status : mins === 0 ? 'No delay' : `${mins} min`;
  const open = (lane.lanes_open || '').trim();
  if (open) value += ` · ${open} lane${open === '1' ? '' : 's'} open`;
  return { label, value };
}

function delayColor(min) {
  if (min == null) return '#888888';
  if (min < 15) return '#00e400';
  if (min <= 45) return '#ffff00';
  return '#ff0000';
}

export const borderWaitsFeed = {
  id: 'custom-border-waits',
  name: 'Border Wait Times',
  icon: '🛂',
  source: 'US CBP',
  updateInterval: 15 * 60_000,

  async fetchRows(signal) {
    const res = await fetch(BWT_URL, { signal });
    if (!res.ok) throw new Error(`CBP ${res.status}`);
    const ports = await res.json();
    const rows = [];
    for (const p of ports) {
      const known = PORTS[p.port_number];
      if (!known) continue;
      const lanes = p.passenger_vehicle_lanes || {};
      const std = lanes.standard_lanes || {};
      const delay = parseInt(std.delay_minutes, 10);
      const mins = Number.isFinite(delay) ? delay : null;
      const details = [];
      if (p.port_status) details.push({ label: 'Port status', value: p.port_status });
      if (p.hours) details.push({ label: 'Hours', value: p.hours });
      const stdDetail = laneDetail(lanes.standard_lanes, 'Standard vehicles');
      if (stdDetail) details.push(stdDetail);
      const nexusDetail = laneDetail(lanes.NEXUS_SENTRI_lanes, 'NEXUS / SENTRI');
      if (nexusDetail) details.push(nexusDetail);
      const commercialDetail = laneDetail(
        p.commercial_vehicle_lanes?.standard_lanes,
        'Commercial',
      );
      if (commercialDetail) details.push(commercialDetail);
      const pedDetail = laneDetail(
        p.pedestrian_lanes?.standard_lanes,
        'Pedestrian',
      );
      if (pedDetail) details.push(pedDetail);
      const updated = (std.update_time || '').trim();
      if (updated) details.push({ label: 'Updated', value: updated });
      rows.push({
        id: p.port_number,
        lon: known.lon,
        lat: known.lat,
        title: `🛂 ${known.name}`,
        subtitle:
          mins == null
            ? 'No delay reported'
            : mins === 0
              ? 'No delay'
              : `${mins} min delay`,
        colorCss: delayColor(mins),
        pointSize: 10,
        details,
      });
    }
    return rows;
  },
};
