/**
 * Concerts & festivals — Ticketmaster Discovery API.
 * Needs a free API key (self-serve signup at developer.ticketmaster.com,
 * free tier 5,000 calls/day). Without a key the layer stays empty and
 * explains why.
 */

const TM_KEY = ''; // <-- paste a free Ticketmaster API key here
const TM_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

export const concertsFeed = {
  id: 'custom-concerts',
  name: 'Concerts & Festivals',
  icon: '🎵',
  source: 'Ticketmaster',
  updateInterval: 24 * 3600_000,
  colorCss: '#ff2fb3',

  async fetchRows(signal) {
    if (!TM_KEY) {
      console.info(
        '[Custom:custom-concerts] No Ticketmaster key set — add one in src/layers/custom/feeds/concerts.js',
      );
      return [];
    }
    const params = new URLSearchParams({
      apikey: TM_KEY,
      size: '60',
      sort: 'date,asc',
      countryCode: 'CA',
      classificationName: 'music',
    });
    const res = await fetch(`${TM_URL}?${params}`, { signal });
    if (!res.ok) throw new Error(`Ticketmaster ${res.status}`);
    const data = await res.json();
    const events = data._embedded?.events || [];
    return events
      .filter((e) => e._embedded?.venues?.[0]?.location)
      .map((e) => {
        const v = e._embedded.venues[0];
        return {
          id: e.id,
          lon: parseFloat(v.location.longitude),
          lat: parseFloat(v.location.latitude),
          title: `🎵 ${e.name}`,
          subtitle: `${v.name}, ${v.city?.name ?? ''} · ${e.dates?.start?.localDate ?? ''}`,
          pointSize: 9,
        };
      });
  },
};
