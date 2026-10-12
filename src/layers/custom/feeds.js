/** Registry of Adam's custom feed definitions. Add new feeds here. */
import { f1CircuitsFeed } from './feeds/f1Circuits.js';
import { meteorShowersFeed } from './feeds/meteorShowers.js';
import { cflStadiumsFeed } from './feeds/cflStadiums.js';
import { volcanoesFeed } from './feeds/volcanoes.js';

export const CUSTOM_FEEDS = Object.freeze([
  f1CircuitsFeed,
  meteorShowersFeed,
  cflStadiumsFeed,
  volcanoesFeed,
]);
