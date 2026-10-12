/**
 * Air quality — Open-Meteo air quality API (keyless, free).
 * Samples major world cities hourly; colors by US AQI band.
 */

const CITIES = [
  ['Vancouver', 49.28, -123.12], ['Seattle', 47.61, -122.33],
  ['Los Angeles', 34.05, -118.24], ['New York', 40.71, -74.0],
  ['Toronto', 43.65, -79.38], ['Mexico City', 19.43, -99.13],
  ['São Paulo', -23.55, -46.63], ['London', 51.51, -0.13],
  ['Paris', 48.86, 2.35], ['Berlin', 52.52, 13.4],
  ['Madrid', 40.42, -3.7], ['Rome', 41.9, 12.5],
  ['Moscow', 55.76, 37.62], ['Cairo', 30.04, 31.24],
  ['Lagos', 6.52, 3.38], ['Johannesburg', -26.2, 28.05],
  ['Dubai', 25.2, 55.27], ['Mumbai', 19.08, 72.88],
  ['Delhi', 28.61, 77.21], ['Bangkok', 13.76, 100.5],
  ['Singapore', 1.35, 103.82], ['Jakarta', -6.21, 106.85],
  ['Manila', 14.6, 120.98], ['Hong Kong', 22.32, 114.17],
  ['Shanghai', 31.23, 121.47], ['Beijing', 39.9, 116.4],
  ['Seoul', 37.57, 126.98], ['Tokyo', 35.68, 139.69],
  ['Sydney', -33.87, 151.21], ['Auckland', -36.85, 174.76],
];

function aqiColor(aqi) {
  if (aqi == null) return '#888888';
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}

function aqiLabel(aqi) {
  if (aqi == null) return 'n/a';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (sensitive)';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very unhealthy';
  return 'Hazardous';
}

export const airQualityFeed = {
  id: 'custom-air-quality',
  name: 'Air Quality',
  icon: '😷',
  source: 'Open-Meteo',
  updateInterval: 60 * 60_000,

  async fetchRows(signal) {
    const nowHour = new Date().toISOString().slice(0, 13);
    const results = await Promise.all(
      CITIES.map(async ([name, lat, lon]) => {
        try {
          const url =
            `https://air-quality-api.open-meteo.com/v1/air-quality` +
            `?latitude=${lat}&longitude=${lon}&hourly=us_aqi&forecast_days=1`;
          const res = await fetch(url, { signal });
          if (!res.ok) return null;
          const data = await res.json();
          const times = data.hourly?.time || [];
          const values = data.hourly?.us_aqi || [];
          const idx = times.findIndex((t) => t.slice(0, 13) === nowHour);
          const aqi = idx >= 0 ? values[idx] : values[0];
          return { name, lat, lon, aqi };
        } catch {
          return null;
        }
      }),
    );
    return results
      .filter(Boolean)
      .map((c) => ({
        id: c.name,
        lon: c.lon,
        lat: c.lat,
        title: `${c.name}`,
        subtitle: `US AQI ${c.aqi ?? 'n/a'} — ${aqiLabel(c.aqi)}`,
        colorCss: aqiColor(c.aqi),
        pointSize: 10,
      }));
  },
};
