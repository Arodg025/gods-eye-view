/**
 * CFL stadiums — all nine, static.
 */

const STADIUMS = [
  { team: 'BC Lions', stadium: 'BC Place', lon: -123.1119, lat: 49.2768 },
  { team: 'Calgary Stampeders', stadium: 'McMahon Stadium', lon: -114.1218, lat: 51.07 },
  { team: 'Edmonton Elks', stadium: 'Commonwealth Stadium', lon: -113.4768, lat: 53.5593 },
  { team: 'Saskatchewan Roughriders', stadium: 'Mosaic Stadium', lon: -104.6158, lat: 50.4553 },
  { team: 'Winnipeg Blue Bombers', stadium: 'IG Field', lon: -97.1433, lat: 49.8077 },
  { team: 'Hamilton Tiger-Cats', stadium: 'Tim Hortons Field', lon: -79.8326, lat: 43.252 },
  { team: 'Toronto Argonauts', stadium: 'BMO Field', lon: -79.4186, lat: 43.6332 },
  { team: 'Ottawa Redblacks', stadium: 'TD Place', lon: -75.6831, lat: 45.3982 },
  { team: 'Montreal Alouettes', stadium: 'Percival Molson Stadium', lon: -73.5881, lat: 45.5048 },
];

export const cflStadiumsFeed = {
  id: 'custom-cfl-stadiums',
  name: 'CFL Stadiums',
  icon: '🏈',
  source: 'Static',
  updateInterval: 30 * 24 * 3600_000,
  colorCss: '#c8102e',

  async fetchRows() {
    return STADIUMS.map((s) => ({
      id: s.stadium,
      lon: s.lon,
      lat: s.lat,
      title: `🏈 ${s.team}`,
      subtitle: s.stadium,
      pointSize: 10,
      // The static list only carries team + stadium — no capacity, opened
      // year, or surface data, so the tooltip restates what the feed has.
      details: [
        { label: 'Team', value: s.team },
        { label: 'Stadium', value: s.stadium },
        { label: 'League', value: 'CFL' },
      ],
    }));
  },
};
