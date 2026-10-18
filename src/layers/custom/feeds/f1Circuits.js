/**
 * F1 circuits — 2026 calendar with next-race highlight.
 * Calendar + coordinates from the Jolpica F1 API (verified live Oct 2026).
 * Static snapshot: refresh when the calendar changes.
 */

const CIRCUITS = [
  { name: 'Australian Grand Prix', circuit: 'Albert Park', lon: 144.968, lat: -37.8497, date: '2026-03-08' },
  { name: 'Chinese Grand Prix', circuit: 'Shanghai International', lon: 121.22, lat: 31.3389, date: '2026-03-15' },
  { name: 'Japanese Grand Prix', circuit: 'Suzuka', lon: 136.541, lat: 34.8431, date: '2026-03-29' },
  { name: 'Miami Grand Prix', circuit: 'Miami International Autodrome', lon: -80.2389, lat: 25.9581, date: '2026-05-03' },
  { name: 'Canadian Grand Prix', circuit: 'Circuit Gilles-Villeneuve', lon: -73.5228, lat: 45.5, date: '2026-05-24' },
  { name: 'Monaco Grand Prix', circuit: 'Monte Carlo', lon: 7.42056, lat: 43.7347, date: '2026-06-07' },
  { name: 'Barcelona Grand Prix', circuit: 'Catalunya', lon: 2.26111, lat: 41.57, date: '2026-06-14' },
  { name: 'Austrian Grand Prix', circuit: 'Red Bull Ring', lon: 14.7647, lat: 47.2197, date: '2026-06-28' },
  { name: 'British Grand Prix', circuit: 'Silverstone', lon: -1.01694, lat: 52.0786, date: '2026-07-05' },
  { name: 'Belgian Grand Prix', circuit: 'Spa-Francorchamps', lon: 5.97139, lat: 50.4372, date: '2026-07-19' },
  { name: 'Hungarian Grand Prix', circuit: 'Hungaroring', lon: 19.2486, lat: 47.5789, date: '2026-07-26' },
  { name: 'Dutch Grand Prix', circuit: 'Zandvoort', lon: 4.54092, lat: 52.3888, date: '2026-08-23' },
  { name: 'Italian Grand Prix', circuit: 'Monza', lon: 9.28111, lat: 45.6156, date: '2026-09-06' },
  { name: 'Spanish Grand Prix', circuit: 'Madrid (new)', lon: -3.61528, lat: 40.46528, date: '2026-09-13' },
  { name: 'Azerbaijan Grand Prix', circuit: 'Baku City', lon: 49.8533, lat: 40.3725, date: '2026-09-26' },
  { name: 'Malaysian Grand Prix', circuit: 'Sepang', lon: 101.738, lat: 2.76083, date: '2026-10-04' },
  { name: 'Singapore Grand Prix', circuit: 'Marina Bay', lon: 103.864, lat: 1.2914, date: '2026-10-11' },
  { name: 'United States Grand Prix', circuit: 'COTA, Austin', lon: -97.6411, lat: 30.1328, date: '2026-10-25' },
  { name: 'Mexico City Grand Prix', circuit: 'Hermanos Rodríguez', lon: -99.0907, lat: 19.4042, date: '2026-11-01' },
  { name: 'Brazilian Grand Prix', circuit: 'Interlagos', lon: -46.6997, lat: -23.7036, date: '2026-11-08' },
  { name: 'Las Vegas Grand Prix', circuit: 'Las Vegas Strip', lon: -115.173, lat: 36.1147, date: '2026-11-22' },
  { name: 'Qatar Grand Prix', circuit: 'Losail', lon: 51.4542, lat: 25.49, date: '2026-11-29' },
  { name: 'Abu Dhabi Grand Prix', circuit: 'Yas Marina', lon: 54.6031, lat: 24.4672, date: '2026-12-06' },
];

export const f1CircuitsFeed = {
  id: 'custom-f1-circuits',
  name: 'F1 Circuits 2026',
  icon: '🏁',
  source: 'Jolpica F1',
  updateInterval: 24 * 3600_000,
  colorCss: '#e10600',

  async fetchRows() {
    const now = Date.now();
    let nextIdx = CIRCUITS.findIndex((c) => new Date(c.date + 'T00:00:00Z').getTime() >= now - 86400000);
    if (nextIdx < 0) nextIdx = CIRCUITS.length - 1;
    return CIRCUITS.map((c, i) => {
      const isNext = i === nextIdx;
      const isPast = new Date(c.date + 'T00:00:00Z').getTime() < now - 86400000;
      return {
        id: c.circuit,
        lon: c.lon,
        lat: c.lat,
        title: isNext ? `🏁 ${c.name}` : c.name,
        subtitle: `${c.circuit} · ${c.date}${isNext ? ' — NEXT RACE' : ''}`,
        colorCss: isNext ? '#ffd700' : isPast ? '#888888' : '#e10600',
        pointSize: isNext ? 14 : 8,
        // The snapshot only carries name / circuit / date — no track length,
        // turn count, or lap record, so those stay out rather than guessed.
        details: [
          { label: 'Circuit', value: c.circuit },
          { label: 'Race date', value: c.date },
          {
            label: 'Status',
            value: isNext ? 'Next race' : isPast ? 'Completed' : 'Upcoming',
          },
        ],
      };
    });
  },
};
