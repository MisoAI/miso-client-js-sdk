import { TRACKING_EVENT_TYPES } from '../../constants.js';
import { mergeOptions, normalizeOptions } from './utils.js';

export const DEFAULT_TRACKER_OPTIONS = Object.freeze({
  active: true,
  impression: Object.freeze({
    active: true,
  }),
  viewable: Object.freeze({
    active: true,
    area: 0.5,
    duration: 1000,
  }),
  click: Object.freeze({
    active: true,
    lenient: false,
  }),
});

export function normalizeTrackersOptions(options = {}) {
  options = normalizeOptions(options);
  const { active, ...rest } = options;
  const normalized = {};
  for (const [role, args] of Object.entries(rest)) {
    normalized[role] = normalizeTrackerOptions(args);
  }
  return {
    active,
    ...normalized,
  };
}

function normalizeTrackerOptions(options = {}) {
  options = normalizeOptions(options);
  const { active, ...rest } = options;
  const normalized = {};
  for (const [role, args] of Object.entries(rest)) {
    normalized[role] = normalizeTrackerEventOptions(args);
  }
  return options;
}

function normalizeTrackerEventOptions(options = {}) {
  options = normalizeOptions(options);
  return options;
}

export function mergeTrackersOptions(...optionsList) {
  // TODO: should be able to remove this
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => {
    for (const [key, args] of Object.entries(options)) {
      if (args === undefined) {
        continue;
      }
      merged[key] = key === 'active' ? args : mergeTrackerOptions(merged[key], args);
    }
    return merged;
  });
}

function mergeTrackerOptions(base = {}, overrides = {}) {
  const merged = { ...base };
  for (const [key, args] of Object.entries(overrides)) {
    if (args === undefined) {
      continue;
    }
    merged[key] = TRACKING_EVENT_TYPES.includes(key) ? mergeTrackerEventOptions(base[key], args) : args;
  }
  return merged;
}

function mergeTrackerEventOptions(base = {}, overrides = {}) {
  return {
    ...base,
    ...overrides,
  };
}
