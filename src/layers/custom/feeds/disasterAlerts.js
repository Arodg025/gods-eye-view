/**
 * Disaster alerts — GDACS (UN/EU Global Disaster Alert and Coordination System).
 * RSS feed, no key. Keeps Orange/Red alerts for tropical cyclones, floods,
 * droughts and tsunamis only — earthquakes, volcanoes and wildfires duplicate
 * layers the app already has. Sparse by nature: expect a handful of dots, and
 * only items flagged current by GDACS. Drought titles carry no color prefix;
 * their level is read from the description instead.
 */

const GDACS_RSS = 'https://www.gdacs.org/xml/rss.xml';
const KEEP_TYPES = new Set(['TC', 'FL', 'DR', 'TS']);
const TYPE_NAMES = {
  TC: 'Tropical cyclone',
  FL: 'Flood',
  DR: 'Drought',
  TS: 'Tsunami',
};
const ALERT_COLORS = { Red: '#ff2222', Orange: '#ff8800' };

function tagText(item, tag) {
  return item.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
}

function alertLevel(title, description) {
  const fromTitle = /^(Red|Orange)\b/i.exec(title)?.[1];
  if (fromTitle) return fromTitle[0].toUpperCase() + fromTitle.slice(1).toLowerCase();
  const fromDesc = /notification level is (Red|Orange)\b/i.exec(description)?.[1];
  return fromDesc || null;
}

function eventName(title, type) {
  if (type === 'TC') {
    const m = /tropical cyclone ([A-Z0-9-]+)/i.exec(title);
    if (m) return m[1];
  }
  if (type === 'DR') return 'Drought';
  const first = title.split('.')[0].trim();
  return first.length > 90 ? first.slice(0, 87) + '…' : first;
}

function countries(title, description, type) {
  let m = /affects these countries: ([^.]+)\./i.exec(description);
  if (m) return m[1].replace(/\s*\(vulnerability[^)]*\)/gi, '').trim();
  m = /(?:on going in|in)\s+([^.]+)\./i.exec(title);
  if (m) return m[1].trim();
  return '';
}

export const disasterAlertsFeed = {
  id: 'custom-disaster-alerts',
  name: 'Disaster Alerts',
  icon: '🚨',
  source: 'GDACS',
  updateInterval: 30 * 60_000,

  async fetchRows(signal) {
    const res = await fetch(GDACS_RSS, { signal });
    if (!res.ok) throw new Error(`GDACS ${res.status}`);
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    const seen = new Set();
    const rows = [];
    for (const item of xml.querySelectorAll('item')) {
      const title = tagText(item, 'title');
      const description = tagText(item, 'description');
      const link = tagText(item, 'link');
      const guid = tagText(item, 'guid') || link;
      const type = /eventtype=([A-Z]{2})/i.exec(link)?.[1]?.toUpperCase();
      if (!type || !KEEP_TYPES.has(type)) continue;
      const alert = alertLevel(title, description);
      if (alert !== 'Red' && alert !== 'Orange') continue;
      if (tagText(item, 'gdacs:iscurrent').toLowerCase() !== 'true') continue;
      const coords = tagText(item, 'georss:point').split(/\s+/).map(Number);
      if (coords.length < 2 || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) continue;
      if (seen.has(guid)) continue;
      seen.add(guid);
      const name = eventName(title, type);
      const place = countries(title, description, type);
      const pubDate = tagText(item, 'pubDate');
      rows.push({
        id: guid,
        lon: coords[1],
        lat: coords[0],
        title: `${alert === 'Red' ? '🔴' : '🟠'} ${name}`,
        subtitle: `${TYPE_NAMES[type]} · ${place || '—'}`,
        pointSize: 10,
        colorCss: ALERT_COLORS[alert],
        details: [
          { label: 'Alert level', value: alert },
          { label: 'Type', value: TYPE_NAMES[type] },
          ...(place ? [{ label: 'Countries', value: place }] : []),
          ...(pubDate ? [{ label: 'Updated', value: pubDate }] : []),
          { label: 'Source', value: 'GDACS' },
        ],
      });
    }
    return rows;
  },
};
