/** Registry of Adam's custom feed definitions. Add new feeds here. */
import { f1CircuitsFeed } from './feeds/f1Circuits.js';
import { meteorShowersFeed } from './feeds/meteorShowers.js';
import { cflStadiumsFeed } from './feeds/cflStadiums.js';
import { volcanoesFeed } from './feeds/volcanoes.js';
import { auroraFeed } from './feeds/aurora.js';
import { airQualityFeed } from './feeds/airQuality.js';
import { issFlyoversFeed } from './feeds/issFlyovers.js';
import { superchargersFeed } from './feeds/superchargers.js';
import { borderWaitsFeed } from './feeds/borderWaits.js';

export const CUSTOM_FEEDS = Object.freeze([
  f1CircuitsFeed,
  meteorShowersFeed,
  cflStadiumsFeed,
  volcanoesFeed,
  auroraFeed,
  airQualityFeed,
  issFlyoversFeed,
  superchargersFeed,
  borderWaitsFeed,
]);
