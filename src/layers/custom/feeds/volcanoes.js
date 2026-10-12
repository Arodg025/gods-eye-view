/**
 * Active volcanoes — curated snapshot of significant active volcanoes.
 * Snapshot pattern (weekly refresh cadence like the volcano-explorer project):
 * Smithsonian GVP publishes a weekly RSS activity report but sets no
 * consistent CORS headers, so we bundle a curated baseline and refresh it
 * periodically rather than fetching live in the browser.
 */

const VOLCANOES = [
  { name: 'Kilauea', country: 'USA (Hawaii)', lon: -155.283, lat: 19.406 },
  { name: 'Mount St. Helens', country: 'USA (Washington)', lon: -122.183, lat: 46.2 },
  { name: 'Mount Rainier', country: 'USA (Washington)', lon: -121.758, lat: 46.87 },
  { name: 'Yellowstone Caldera', country: 'USA (Wyoming)', lon: -110.7, lat: 44.43 },
  { name: 'Popocatépetl', country: 'Mexico', lon: -98.622, lat: 19.023 },
  { name: 'Fuego', country: 'Guatemala', lon: -90.88, lat: 14.473 },
  { name: 'Pacaya', country: 'Guatemala', lon: -90.601, lat: 14.381 },
  { name: 'Arenal', country: 'Costa Rica', lon: -84.703, lat: 10.463 },
  { name: 'Cotopaxi', country: 'Ecuador', lon: -78.436, lat: -0.677 },
  { name: 'Tungurahua', country: 'Ecuador', lon: -78.447, lat: -1.467 },
  { name: 'Villarrica', country: 'Chile', lon: -71.93, lat: -39.42 },
  { name: 'Llaima', country: 'Chile', lon: -71.73, lat: -38.692 },
  { name: 'Nevado del Ruiz', country: 'Colombia', lon: -75.322, lat: 4.892 },
  { name: 'Galeras', country: 'Colombia', lon: -77.355, lat: 1.22 },
  { name: 'Soufrière Hills', country: 'Montserrat', lon: -62.177, lat: 16.71 },
  { name: 'La Soufrière', country: 'St. Vincent', lon: -61.18, lat: 13.33 },
  { name: 'Pelé', country: 'Martinique', lon: -61.167, lat: 14.809 },
  { name: 'Etna', country: 'Italy (Sicily)', lon: 14.999, lat: 37.748 },
  { name: 'Stromboli', country: 'Italy', lon: 15.213, lat: 38.789 },
  { name: 'Vesuvius', country: 'Italy', lon: 14.426, lat: 40.821 },
  { name: 'Santorini (Nea Kameni)', country: 'Greece', lon: 25.397, lat: 36.404 },
  { name: 'Eyjafjallajökull', country: 'Iceland', lon: -19.62, lat: 63.633 },
  { name: 'Grímsvötn', country: 'Iceland', lon: -17.33, lat: 64.42 },
  { name: 'Katla', country: 'Iceland', lon: -19.05, lat: 63.633 },
  { name: 'Hekla', country: 'Iceland', lon: -19.7, lat: 63.983 },
  { name: 'Fagradalsfjall', country: 'Iceland', lon: -22.27, lat: 63.903 },
  { name: 'Nyiragongo', country: 'DR Congo', lon: 29.25, lat: -1.52 },
  { name: 'Nyamuragira', country: 'DR Congo', lon: 29.2, lat: -1.408 },
  { name: 'Ol Doinyo Lengai', country: 'Tanzania', lon: 35.914, lat: -2.764 },
  { name: 'Erta Ale', country: 'Ethiopia', lon: 40.63, lat: 13.6 },
  { name: 'Krakatau (Anak Krakatau)', country: 'Indonesia', lon: 105.423, lat: -6.102 },
  { name: 'Merapi', country: 'Indonesia (Java)', lon: 110.446, lat: -7.54 },
  { name: 'Semeru', country: 'Indonesia (Java)', lon: 112.922, lat: -8.108 },
  { name: 'Tambora', country: 'Indonesia (Sumbawa)', lon: 118.0, lat: -8.25 },
  { name: 'Rinjani', country: 'Indonesia (Lombok)', lon: 116.47, lat: -8.42 },
  { name: 'Agung', country: 'Indonesia (Bali)', lon: 115.508, lat: -8.342 },
  { name: 'Mayon', country: 'Philippines', lon: 123.69, lat: 13.257 },
  { name: 'Taal', country: 'Philippines', lon: 120.993, lat: 14.002 },
  { name: 'Pinatubo', country: 'Philippines', lon: 120.35, lat: 15.13 },
  { name: 'Mount Unzen', country: 'Japan', lon: 130.298, lat: 32.758 },
  { name: 'Sakurajima', country: 'Japan', lon: 130.657, lat: 31.585 },
  { name: 'Mount Aso', country: 'Japan', lon: 131.104, lat: 32.884 },
  { name: 'Mount Fuji', country: 'Japan', lon: 138.728, lat: 35.361 },
  { name: 'White Island (Whakaari)', country: 'New Zealand', lon: 177.183, lat: -37.52 },
  { name: 'Ruapehu', country: 'New Zealand', lon: 175.578, lat: -39.281 },
  { name: 'Kavachi', country: 'Solomon Islands', lon: 157.98, lat: -8.995 },
  { name: 'Yasur', country: 'Vanuatu', lon: 169.448, lat: -19.532 },
  { name: 'Ambrym', country: 'Vanuatu', lon: 168.12, lat: -16.25 },
  { name: 'Erebus', country: 'Antarctica', lon: 167.17, lat: -77.53 },
  { name: 'Deception Island', country: 'Antarctica', lon: -60.65, lat: -62.95 },
  { name: 'Bezymianny', country: 'Russia (Kamchatka)', lon: 159.97, lat: 55.978 },
  { name: 'Shiveluch', country: 'Russia (Kamchatka)', lon: 161.36, lat: 56.653 },
  { name: 'Klyuchevskoy', country: 'Russia (Kamchatka)', lon: 160.638, lat: 56.057 },
];

export const volcanoesFeed = {
  id: 'custom-volcanoes',
  name: 'Active Volcanoes',
  icon: '🌋',
  source: 'Smithsonian GVP (snapshot)',
  updateInterval: 7 * 24 * 3600_000,
  colorCss: '#ff5a00',

  async fetchRows() {
    return VOLCANOES.map((v) => ({
      id: v.name,
      lon: v.lon,
      lat: v.lat,
      title: `🌋 ${v.name}`,
      subtitle: v.country,
      pointSize: 9,
    }));
  },
};
