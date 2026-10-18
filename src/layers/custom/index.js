import * as Cesium from 'cesium';
import { isPointerFree } from '../../data/inputOwnership.js';

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
 * A row is { lon, lat, title, subtitle?, color?, pointSize?, label?, details? }.
 * `details` is an optional array of { label, value } pairs (or plain strings)
 * shown in the hover tooltip under the title/subtitle.
 * Feeds may optionally supply renderRows(Cesium, rows, dataSource) to take
 * over rendering entirely (used by overlays like the aurora oval); such a
 * renderer should call attachCustomHoverInfo(entity, feed, {...}) for each
 * entity it wants hoverable.
 */

const DEFAULT_POINT_SIZE = 8;

/** Cap on scene.pick calls per second while the pointer moves (mirrors CCTV). */
const HOVER_PICK_THROTTLE_MS = 120;
/** Max drill-pick candidates examined when the top pick is not a custom entity. */
const HOVER_DRILL_PICK_LIMIT = 8;
/** Max detail lines shown in one tooltip. */
const HOVER_MAX_DETAILS = 12;
const HOVER_TOOLTIP_OFFSET_PX = 14;

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

/** Normalize a row's `details` into clean { label, value } pairs. */
function normalizeDetails(details) {
  if (!Array.isArray(details)) return [];
  const out = [];
  for (const entry of details) {
    if (out.length >= HOVER_MAX_DETAILS) break;
    if (typeof entry === 'string') {
      const value = entry.trim();
      if (value) out.push({ label: '', value });
      continue;
    }
    if (!entry || typeof entry !== 'object') continue;
    const label = typeof entry.label === 'string' ? entry.label.trim() : '';
    const value = entry.value == null ? '' : String(entry.value).trim();
    if (!value) continue;
    out.push({ label, value });
  }
  return out;
}

/**
 * Attach the hover-tooltip payload to an entity. The shared renderer calls
 * this for point layers; custom renderRows (e.g. aurora) call it themselves.
 */
export function attachCustomHoverInfo(entity, feed, { title, subtitle, details } = {}) {
  if (!entity || !feed?.id) return;
  entity.__gevCustom = {
    feedId: feed.id,
    title: title || '',
    subtitle: subtitle || '',
    details: normalizeDetails(details),
  };
}

function defaultRenderRows(Cesium, rows, dataSource, feed) {
  const now = Cesium.JulianDate.now();
  const feedColor = resolveColor(Cesium, feed.colorCss, Cesium.Color.YELLOW);
  for (const row of rows) {
    if (!Number.isFinite(row.lon) || !Number.isFinite(row.lat)) continue;
    const color = resolveColor(Cesium, row.colorCss, feedColor);
    const position = Cesium.Cartesian3.fromDegrees(row.lon, row.lat);
    const entity = dataSource.entities.add(
      new Cesium.Entity({
        id: `${feed.id}:${row.id || `${row.lon},${row.lat}`}`,
        position,
        point: {
          pixelSize: row.pointSize || DEFAULT_POINT_SIZE,
          color,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: 0,
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
                disableDepthTestDistance: 0,
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
    attachCustomHoverInfo(entity, feed, {
      title: row.title,
      subtitle: row.subtitle,
      details: row.details,
    });
  }
  return now;
}

// ---------------------------------------------------------------------------
// Shared hover tooltip. One ScreenSpaceEventHandler serves every custom layer:
// each layer registers its dataSource on init, and the handler only ever acts
// on picks that resolve to an entity carrying a __gevCustom payload from a
// registered layer — picks belonging to other layers are left alone.
// ---------------------------------------------------------------------------

let _hoverViewer = null;
let _hoverHandler = null;
let _hoverTooltipEl = null;
let _hoverLastPickAt = 0;
let _hoverCurrentFeedId = null;
let _hoverCurrentEntityId = null;
/** feedId -> CustomDataSource, for every custom layer currently initialized. */
const _hoverDataSources = new Map();

function ensureCustomTooltipElement() {
  if (_hoverTooltipEl) return _hoverTooltipEl;
  if (typeof document === 'undefined') return null;
  const el = document.createElement('div');
  el.className = 'gev-custom-hover-tooltip';
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '10000',
    pointerEvents: 'none',
    display: 'none',
    maxWidth: '320px',
    padding: '8px 10px',
    borderRadius: '8px',
    background: 'rgba(10, 14, 20, 0.92)',
    color: '#fff',
    font: '13px/1.45 system-ui, sans-serif',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
    whiteSpace: 'normal',
  });
  document.body.appendChild(el);
  _hoverTooltipEl = el;
  return el;
}

function renderCustomTooltip(el, info) {
  // textContent only — feed data comes from external APIs and is untrusted.
  el.replaceChildren();
  const title = document.createElement('div');
  title.textContent = info.title || info.feedId;
  title.style.fontWeight = '700';
  title.style.marginBottom = '2px';
  el.appendChild(title);
  if (info.subtitle) {
    const subtitle = document.createElement('div');
    subtitle.textContent = info.subtitle;
    subtitle.style.opacity = '0.85';
    el.appendChild(subtitle);
  }
  for (const detail of info.details || []) {
    const line = document.createElement('div');
    if (detail.label) {
      const label = document.createElement('span');
      label.textContent = `${detail.label}: `;
      label.style.opacity = '0.65';
      line.appendChild(label);
    }
    const value = document.createElement('span');
    value.textContent = detail.value;
    line.appendChild(value);
    el.appendChild(line);
  }
}

function positionCustomTooltip(el, x, y) {
  if (typeof window === 'undefined') return;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  let left = x + HOVER_TOOLTIP_OFFSET_PX;
  let top = y + HOVER_TOOLTIP_OFFSET_PX;
  if (left + w > window.innerWidth - 8) left = x - w - HOVER_TOOLTIP_OFFSET_PX;
  if (top + h > window.innerHeight - 8) top = y - h - HOVER_TOOLTIP_OFFSET_PX;
  el.style.left = `${Math.max(8, left)}px`;
  el.style.top = `${Math.max(8, top)}px`;
}

function showCustomTooltip(info, entityId, position) {
  const el = ensureCustomTooltipElement();
  if (!el) return;
  if (_hoverCurrentEntityId !== entityId) {
    renderCustomTooltip(el, info);
    _hoverCurrentEntityId = entityId;
  }
  _hoverCurrentFeedId = info.feedId;
  el.style.display = 'block';
  positionCustomTooltip(el, position.x, position.y);
}

/** Hide the tooltip; when `feedId` is given, only hide if it owns the tooltip. */
function hideCustomTooltip(feedId) {
  if (feedId && _hoverCurrentFeedId && _hoverCurrentFeedId !== feedId) return;
  if (_hoverTooltipEl) _hoverTooltipEl.style.display = 'none';
  _hoverCurrentFeedId = null;
  _hoverCurrentEntityId = null;
}

function customInfoFromPick(picked) {
  const entity = picked?.id;
  if (!entity || typeof entity !== 'object') return null;
  const info = entity.__gevCustom;
  if (!info || !_hoverDataSources.has(info.feedId)) return null;
  return {
    info,
    entityId: typeof entity.id === 'string' ? entity.id : null,
  };
}

function resolveCustomHoverPick(scene, position, picked) {
  const top = customInfoFromPick(picked);
  if (top) return top;
  // The top pick may belong to another layer (e.g. its label overlapping a
  // small custom point) — look a little deeper, but only act on custom hits.
  if (typeof scene.drillPick === 'function') {
    let drilled = [];
    try {
      drilled = scene.drillPick(position, HOVER_DRILL_PICK_LIMIT) || [];
    } catch {
      drilled = [];
    }
    for (const candidate of drilled) {
      const resolved = customInfoFromPick(candidate);
      if (resolved) return resolved;
    }
  }
  return null;
}

function handleCustomHoverMove(movement) {
  const position = movement?.endPosition;
  if (!position || !_hoverViewer || _hoverViewer.isDestroyed?.()) return;
  // The tooltip follows the cursor on every move; picking itself is throttled.
  if (_hoverTooltipEl && _hoverTooltipEl.style.display !== 'none') {
    positionCustomTooltip(_hoverTooltipEl, position.x, position.y);
  }
  // A tool owns the pointer (src/data/inputOwnership.js): yield — no tooltip.
  if (!isPointerFree()) {
    hideCustomTooltip();
    return;
  }
  const now = Date.now();
  if (now - _hoverLastPickAt < HOVER_PICK_THROTTLE_MS) return;
  _hoverLastPickAt = now;
  let resolved = null;
  try {
    resolved = resolveCustomHoverPick(
      _hoverViewer.scene,
      position,
      _hoverViewer.scene.pick(position),
    );
  } catch {
    resolved = null;
  }
  if (resolved) showCustomTooltip(resolved.info, resolved.entityId, position);
  else hideCustomTooltip();
}

function registerCustomHoverLayer(viewer, feedId, dataSource) {
  _hoverDataSources.set(feedId, dataSource);
  if (_hoverHandler) return;
  if (!viewer) return;
  _hoverViewer = viewer;
  ensureCustomTooltipElement();
  _hoverHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  _hoverHandler.setInputAction(
    handleCustomHoverMove,
    Cesium.ScreenSpaceEventType.MOUSE_MOVE,
  );
}

function unregisterCustomHoverLayer(feedId) {
  hideCustomTooltip(feedId);
  _hoverDataSources.delete(feedId);
  if (_hoverDataSources.size > 0) return;
  _hoverHandler?.destroy();
  _hoverHandler = null;
  _hoverViewer = null;
  _hoverLastPickAt = 0;
  if (_hoverTooltipEl) {
    _hoverTooltipEl.remove();
    _hoverTooltipEl = null;
  }
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
      registerCustomHoverLayer(viewer, feed.id, _dataSource);
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
      hideCustomTooltip(feed.id);
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
        // Entities are about to be replaced — drop any tooltip on this layer.
        hideCustomTooltip(feed.id);
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
      unregisterCustomHoverLayer(feed.id);
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
