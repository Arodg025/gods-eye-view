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
      .map((s) => {
        const details = [];
        if (s.stallCount != null)
          details.push({ label: 'Stalls', value: String(s.stallCount) });
        if (s.powerKilowatt != null)
          details.push({ label: 'Max power', value: `${s.powerKilowatt} kW` });
        if (s.dateOpened)
          details.push({ label: 'Opened', value: s.dateOpened });
        const address = [
          s.address?.street,
          s.address?.city,
          s.address?.state,
          s.address?.zip,
        ]
          .filter(Boolean)
          .join(', ');
        if (address) details.push({ label: 'Address', value: address });
        if (s.facilityName)
          details.push({ label: 'Located at', value: s.facilityName });
        if (s.otherEVs === true)
          details.push({ label: 'Open to other EVs', value: 'Yes' });
        if (s.solarCanopy === true)
          details.push({ label: 'Solar canopy', value: 'Yes' });
        if (s.battery === true)
          details.push({ label: 'Battery storage', value: 'Yes' });
        return {
          id: String(s.id),
          lon: s.gps.longitude,
          lat: s.gps.latitude,
          title: s.name || 'Supercharger',
          subtitle: `${s.stallCount ?? '?'} stalls · ${s.address?.city ?? ''}`,
          pointSize: 6,
          label: false,
          details,
        };
      });
  },
};
