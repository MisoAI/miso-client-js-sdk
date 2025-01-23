import { findInAncestors, trimObj } from '@miso.ai/commons';

// TODO: think about how to incorporate this with workflow options

const DEFAULT_TRACKER_OPTIONS = Object.freeze({
  impression: Object.freeze({
  }),
  viewable: Object.freeze({
    area: 0.5,
    duration: 1000,
  }),
  click: Object.freeze({
    lenient: false,
  }),
  watch: false,
});

function mergeOptions(def, opt) {
  // if opt is falsy then return false, merge otherwise
  return !!opt && { ...def, ...opt };
}

export function normalizeTrackerOptions(options) {
  if (options === false) {
    return false; // turn off all tracking
  }
  if (options === true) {
    options = {};
  }
  if (typeof options !== 'object') {
    throw new Error(`Invalid options: ${options}`);
  }
  const { impression = {}, viewable = {}, click = {}, ...rest } = options;
  return trimObj({
    ...DEFAULT_TRACKER_OPTIONS,
    ...rest,
    impression: mergeOptions(DEFAULT_TRACKER_OPTIONS.impression, impression),
    viewable: mergeOptions(DEFAULT_TRACKER_OPTIONS.viewable, viewable),
    click: mergeOptions(DEFAULT_TRACKER_OPTIONS.click, click),
  });
}

export function validateClick(options = {}, event) {
  if (!options) {
    return false;
  }

  if (typeof options.validate === 'function') {
    return options.validate(event);
  }

  if (options.lenient) {
    return true;
  }

  // standard criteria
  // 1. it must be a left click
  if (event.button !== 0) {
    return false;
  }
  // 2. event default must not be prevented
  if (event.defaultPrevented) {
    return false;
  }
  // 3. must go through a real link
  if (!findInAncestors(event.target, element => (element.tagName === 'A' && element.href) || undefined)) {
    return false;
  }

  return true;
}
