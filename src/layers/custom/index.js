import * as Cesium from 'cesium';

/**
 * Custom feed layers — Adam's personal globe layers.
 *
 * A feed is a plain definition:
 *   {
 *     id,            // unique layer id, e.g. 'custom-f1-circuits'
 *     name,         // display name
 *     icon,         // emoji for the layer picker
 *     source,       // attribution string
 *     updateInterval, // ms between refreshes
 *     fetchRows(signal) -> Promise<Array<row>>,
 *   }
 * A row is { lon, lat, title, subtitle?, color?, pointSize?, label? }.
 * Feeds may optionally supply renderRows(Cesium, rows, dataSource) to take
 * over rendering entirely (used by overlays like the aurora oval).
 */

const DEFAULT_POINT_SIZE = 8;

function resolveColor(Cesium, value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return Cesium.Color.fromCssColorString(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function defaultRenderRows(Cesium, rows, dataSource, feed) {
  const now = Cesium.JulianDate.now();
  const feedColor = resolveColor(Cesium, feed.colorCss, Cesium.Color.YELLOW);
  for (const row of rows) {
    if (!Number.isFinite(row.lon) || !Number.isFinite(row.lat)) continue;
    const color = resolveColor(Cesium, row.colorCss, feedColor);
    const position = Cesium.Cartesian3.fromDegrees(row.lon, row.lat);
    dataSource.entities.add(
      new Cesium.Entity({
        id: `${feed.id}:${row.id || `${row.lon},${row.lat}`}`,
        position,
        point: {
          pixelSize: row.pointSize || DEFAULT_POINT_SIZE,
          color,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label:
          row.label === false
            ? undefined
            : {
                text: row.title || '',
                font: '12px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -18),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                  0,
                  20_000_000,
                ),
              },
        properties: {
          title: row.title || '',
          subtitle: row.subtitle || '',
        },
      }),
    );
  }
  return now;
}

/** Build one toggleable globe layer from a feed definition. */
export function createCustomFeedLayer({ feed } = {}) {
  if (!feed?.id) throw new TypeError('A custom feed definition is required');
  if (typeof feed.fetchRows !== 'function')
    throw new TypeError(`Feed ${feed.id} needs a fetchRows function`);

  let _viewer = null;
  let _dataSource = null;
  let _enabled = false;
  let _request = null;
  let _count = 0;
  let _lastUpdate = null;
  let _lastError = null;

  const renderRows = feed.renderRows || defaultRenderRows;

  const layer = {
    id: feed.id,
    name: feed.name,
    icon: feed.icon || '📍',
    source: feed.source || 'Custom',
    updateInterval: feed.updateInterval || 3600_000,

    init(viewer) {
      if (_viewer) throw new Error(`Layer ${feed.id} already initialized`);
      _viewer = viewer;
      _dataSource = new Cesium.CustomDataSource(feed.id);
      _dataSource.show = false;
      viewer.dataSources.add(_dataSource);
      _enabled = false;
    },

    enable() {
      _enabled = true;
      if (_dataSource) _dataSource.show = true;
      // Refresh on enable so static feeds paint immediately.
      this.update(_viewer);
    },

    disable() {
      _request?.abort();
      _request = null;
      _enabled = false;
      if (_dataSource) {
        _dataSource.show = false;
        _dataSource.entities.removeAll();
      }
    },

    async update() {
      if (!_enabled || !_dataSource) return false;
      _request?.abort();
      const request = new AbortController();
      _request = request;
      try {
        const rows = await feed.fetchRows(request.signal);
        if (request.signal.aborted || _request !== request || !_enabled)
          return false;
        _dataSource.entities.removeAll();
        renderRows(Cesium, rows || [], _dataSource, feed);
        _count = (rows || []).length;
        _lastUpdate = Date.now();
        _lastError = null;
        return true;
      } catch (e) {
        if (request.signal.aborted || _request !== request || !_enabled)
          return false;
        _lastError = e?.message || 'Feed unavailable';
        console.warn(`[Custom:${feed.id}] fetch failed:`, _lastError);
        return false;
      } finally {
        if (_request === request) _request = null;
      }
    },

    destroy(viewer = _viewer) {
      _request?.abort();
      _request = null;
      _viewer = null;
      _enabled = false;
      if (_dataSource) {
        viewer?.dataSources.remove(_dataSource, true);
        _dataSource = null;
      }
      _count = 0;
      _lastUpdate = null;
      _lastError = null;
    },

    getStats() {
      return { count: _count, lastUpdate: _lastUpdate, error: _lastError };
    },
  };
  return layer;
}
