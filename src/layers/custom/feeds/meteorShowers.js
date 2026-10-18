/**
 * Meteor showers — major annual showers with radiant subpoints.
 * Plotted at the sub-Earth point of each radiant at local midnight on the
 * peak night: stand there, look up. Data: IMO 2026 Working List.
 * Static: shower geometry is stable year to year.
 */

const SHOWERS = [
  { name: 'Quadrantids', peak: '2026-01-03', ra: 230, dec: 49, zhr: 110 },
  { name: 'Lyrids', peak: '2026-04-22', ra: 271, dec: 34, zhr: 18 },
  { name: 'Eta Aquariids', peak: '2026-05-06', ra: 338, dec: -1, zhr: 50 },
  { name: 'Perseids', peak: '2026-08-12', ra: 46, dec: 58, zhr: 100 },
  { name: 'Orionids', peak: '2026-10-21', ra: 95, dec: 16, zhr: 20 },
  { name: 'Leonids', peak: '2026-11-17', ra: 153, dec: 22, zhr: 15 },
  { name: 'Geminids', peak: '2026-12-14', ra: 112, dec: 33, zhr: 150 },
  { name: 'Ursids', peak: '2026-12-22', ra: 217, dec: 76, zhr: 10 },
];

/** GMST in degrees at 00:00 UTC on the given date. */
function gmstAtMidnight(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const midnight = Date.UTC(y, m - 1, d, 0, 0, 0);
  const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const days = (midnight - j2000) / 86400000;
  return (280.46061837 + 360.98564736629 * days) % 360;
}

/** Sub-Earth longitude where the radiant is at zenith at peak midnight. */
function radiantSubpoint(ra, dec, peak) {
  const gmst = gmstAtMidnight(peak);
  let lon = ra - gmst;
  lon = ((lon + 540) % 360) - 180;
  return { lon, lat: dec };
}

export const meteorShowersFeed = {
  id: 'custom-meteor-showers',
  name: 'Meteor Showers',
  icon: '☄️',
  source: 'IMO Working List',
  updateInterval: 24 * 3600_000,
  colorCss: '#7fd4ff',

  async fetchRows() {
    return SHOWERS.map((s) => {
      const { lon, lat } = radiantSubpoint(s.ra, s.dec, s.peak);
      return {
        id: s.name,
        lon,
        lat,
        title: `☄️ ${s.name}`,
        subtitle: `Peak ${s.peak} · radiant overhead here at midnight · ZHR ~${s.zhr}`,
        pointSize: Math.min(16, 6 + s.zhr / 15),
        details: [
          { label: 'Peak night', value: s.peak },
          { label: 'Zenithal hourly rate', value: `~${s.zhr}/hr` },
          { label: 'Radiant', value: `RA ${s.ra}°, Dec ${s.dec}°` },
          {
            label: 'Where',
            value: 'Radiant at zenith here at midnight on peak night',
          },
        ],
      };
    });
  },
};
