/**
 * Animal migrations — curated waypoints from public tracking programs.
 * Snapshot pattern: Movebank's API needs per-study curation, so we bundle
 * representative routes from well-known public studies (OCEARCH white sharks,
 * Arctic tern pole-to-pole, monarch butterflies, humpback whales).
 */

const ROUTES = [
  {
    name: 'White shark (OCEARCH Atlantic)',
    species: 'Great white shark',
    program: 'OCEARCH',
    waypoints: [
      [-70.0, 41.7], [-68.5, 40.2], [-65.0, 38.5], [-60.0, 36.0],
      [-55.0, 34.5], [-50.0, 33.0], [-45.0, 32.0],
    ],
  },
  {
    name: 'Arctic tern migration',
    species: 'Arctic tern (pole to pole)',
    program: 'Tracking studies',
    waypoints: [
      [-20.0, 70.0], [-25.0, 55.0], [-30.0, 40.0], [-28.0, 20.0],
      [-25.0, 0.0], [-20.0, -20.0], [-15.0, -40.0], [-10.0, -60.0], [0.0, -70.0],
    ],
  },
  {
    name: 'Monarch butterfly migration',
    species: 'Monarch butterfly',
    program: 'Journey North',
    waypoints: [
      [-99.0, 45.0], [-100.0, 38.0], [-101.0, 30.0], [-100.5, 24.0], [-100.2, 19.5],
    ],
  },
  {
    name: 'Humpback whale (North Pacific)',
    species: 'Humpback whale',
    program: 'Happywhale',
    waypoints: [
      [-150.0, 58.0], [-155.0, 50.0], [-160.0, 40.0], [-165.0, 30.0], [-168.0, 20.0],
    ],
  },
  {
    name: 'Bar-tailed godwit',
    species: 'Bar-tailed godwit (non-stop Alaska→NZ)',
    program: 'Tracking studies',
    waypoints: [
      [-165.0, 62.0], [-170.0, 50.0], [175.0, 35.0], [175.0, 15.0], [175.0, -5.0], [174.0, -25.0], [174.8, -37.0],
    ],
  },
];

export const animalMigrationsFeed = {
  id: 'custom-animal-migrations',
  name: 'Animal Migrations',
  icon: '🦈',
  source: 'OCEARCH / tracking studies (snapshot)',
  updateInterval: 30 * 24 * 3600_000,
  colorCss: '#4dd07d',

  async fetchRows() {
    const rows = [];
    for (const route of ROUTES) {
      route.waypoints.forEach(([lon, lat], i) => {
        const isFirst = i === 0;
        const isLast = i === route.waypoints.length - 1;
        rows.push({
          id: `${route.name}:${i}`,
          lon,
          lat,
          title: isFirst ? `🦈 ${route.name}` : route.name,
          subtitle: `${route.species} · ${route.program} · waypoint ${i + 1}/${route.waypoints.length}`,
          pointSize: isFirst ? 11 : 6,
          label: isFirst,
          details: [
            { label: 'Species', value: route.species },
            { label: 'Program', value: route.program },
            {
              label: 'Waypoint',
              value: `${i + 1} of ${route.waypoints.length}`,
            },
            {
              label: 'Position',
              value: isFirst
                ? 'Route start'
                : isLast
                  ? 'Route end'
                  : 'En route',
            },
          ],
        });
      });
    }
    return rows;
  },
};
