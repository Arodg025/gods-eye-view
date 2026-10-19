/**
 * CFL stadiums — all nine, static. Capacity/opened/surface/roof verified
 * against Wikipedia's "List of Canadian Football League stadiums".
 */

const STADIUMS = [
  { team: 'BC Lions', stadium: 'BC Place', lon: -123.1119, lat: 49.2768, capacity: '54,300', opened: '1983', surface: 'Artificial turf', roof: 'Retractable roof' },
  { team: 'Calgary Stampeders', stadium: 'McMahon Stadium', lon: -114.1218, lat: 51.07, capacity: '35,650', opened: '1960', surface: 'Artificial turf', roof: 'Open' },
  { team: 'Edmonton Elks', stadium: 'Commonwealth Stadium', lon: -113.4768, lat: 53.5593, capacity: '56,302', opened: '1978', surface: 'Artificial turf', roof: 'Open' },
  { team: 'Saskatchewan Roughriders', stadium: 'Mosaic Stadium', lon: -104.6158, lat: 50.4553, capacity: '33,350', opened: '2017', surface: 'Artificial turf', roof: 'Open' },
  { team: 'Winnipeg Blue Bombers', stadium: 'IG Field', lon: -97.1433, lat: 49.8077, capacity: '32,343', opened: '2013', surface: 'Artificial turf', roof: 'Open' },
  { team: 'Hamilton Tiger-Cats', stadium: 'Tim Hortons Field', lon: -79.8326, lat: 43.252, capacity: '24,390', opened: '2014', surface: 'Artificial turf', roof: 'Open' },
  { team: 'Toronto Argonauts', stadium: 'BMO Field', lon: -79.4186, lat: 43.6332, capacity: '25,000', opened: '2007', surface: 'Natural grass', roof: 'Open' },
  { team: 'Ottawa Redblacks', stadium: 'TD Place', lon: -75.6831, lat: 45.3982, capacity: '25,000', opened: '1908', surface: 'Artificial turf', roof: 'Open' },
  { team: 'Montreal Alouettes', stadium: 'Percival Molson Stadium', lon: -73.5881, lat: 45.5048, capacity: '20,025', opened: '1919', surface: 'Artificial turf', roof: 'Open' },
];

export const cflStadiumsFeed = {
  id: 'custom-cfl-stadiums',
  name: 'CFL Stadiums',
  icon: '🏈',
  source: 'Wikipedia',
  updateInterval: 30 * 24 * 3600_000,
  colorCss: '#c8102e',

  async fetchRows() {
    return STADIUMS.map((s) => ({
      id: s.stadium,
      lon: s.lon,
      lat: s.lat,
      title: `🏈 ${s.team}`,
      subtitle: `${s.stadium} · ${s.capacity} seats · opened ${s.opened}`,
      pointSize: 10,
      details: [
        { label: 'Team', value: s.team },
        { label: 'Stadium', value: s.stadium },
        { label: 'Capacity', value: `${s.capacity} seats` },
        { label: 'Opened', value: s.opened },
        { label: 'Surface', value: s.surface },
        { label: 'Roof', value: s.roof },
        { label: 'League', value: 'CFL' },
      ],
    }));
  },
};
