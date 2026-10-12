/**
 * Tesla Superchargers — locations from supercharge.info (free, keyless,
 * community-maintained). Live per-stall availability is not freely available
 * anywhere, so this is locations + stall counts + status.
 */

const SITES_URL = 'https://supercharge.info/service/supercharge/allSites';

export const superchargersFeed = {
  id: 'custom-superchargers',
  name: 'Tesla Superchargers',
  icon: '🔌',
  source: 'supercharge.info',
  updateInterval: 24 * 3600_000,
  colorCss: '#e31937',

  async fetchRows(signal) {
    const res = await fetch(SITES_URL, { signal });
    if (!res.ok) throw new Error(`supercharge.info ${res.status}`);
    const sites = await res.json();
    return sites
      .filter((s) => s.status === 'OPEN' && s.gps?.latitude && s.gps?.longitude)
      .map((s) => ({
        id: String(s.id),
        lon: s.gps.longitude,
        lat: s.gps.latitude,
        title: s.name || 'Supercharger',
        subtitle: `${s.stallCount ?? '?'} stalls · ${s.address?.city ?? ''}`,
        pointSize: 6,
        label: false,
      }));
  },
};
