import { createCustomFeedLayer } from '../../layers/custom/index.js';
import { CUSTOM_FEEDS } from '../../layers/custom/feeds.js';

/** Wire Adam's custom feed layers — one toggleable layer per feed. */
export function createApplicationCustomLayers() {
  return CUSTOM_FEEDS.map((feed) => createCustomFeedLayer({ feed }));
}
