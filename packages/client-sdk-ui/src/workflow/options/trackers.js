import { mergeOptions } from './utils.js';

export function normalizeTrackersOptions(options) {
  if (options === undefined || options === false) {
    return options;
  }
  const normalized = {};
  for (const [role, args] of Object.entries(options)) {
    normalized[role] = normalizeTrackerOptions(args);
  }
  return normalized;
}

function normalizeTrackerOptions(options) {
  return options;
}

export function mergeTrackersOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    impression: mergeTrackerEventOptions(merged.impression, options.impression),
    viewable: mergeTrackerEventOptions(merged.viewable, options.viewable),
    click: mergeTrackerEventOptions(merged.click, options.click),
  }));
}

function mergeTrackerEventOptions(base = {}, overrides = {}) {
  return (overrides === false || base === false) ? overrides : { ...base, ...overrides };
}
