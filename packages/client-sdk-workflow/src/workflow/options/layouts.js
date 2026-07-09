import { asArray, lowerCamelToSnake, kebabToSnake } from '@miso.ai/commons';
import { ROLE } from '../../constants.js';
import { mergeOptions } from './utils.js';

export function normalizeLayoutsOptions(options = {}) {
  if (options === false) {
    return false;
  }
  // fallback: results -> products
  const { results, ...rest } = options;
  if (results !== undefined) {
    console.warn(`useLayouts({ results: ... }) is deprecated, use useLayouts({ ${ROLE.PRODUCTS}: ... }) instead`);
    options = { ...rest, [ROLE.PRODUCTS]: results };
  }
  const normalize = {};
  for (const [role, args] of Object.entries(options)) {
    normalize[normalizeRole(role)] = normalizeLayoutOptions(args);
  }
  return normalize;
}

function normalizeRole(role) {
  role = lowerCamelToSnake(role);
  role = kebabToSnake(role);
  return role;
}

function normalizeLayoutOptions(args) {
  // take args:
  // * undefined
  // * false
  // * name (string)
  // * options (object)
  // * [name, options]
  if (args === undefined) {
    return undefined;
  }
  let [name, options] = asArray(args);
  if (typeof name === 'object') {
    options = name;
    name = undefined;
  }
  return [name, options];
}

export function mergeLayoutsOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => {
    for (const [role, args] of Object.entries(options)) {
      merged[role] = mergeLayoutOptions(merged[role], args);
    }
    return merged;
  });
}

function mergeLayoutOptions(base, overrides) {
  overrides = normalizeLayoutOptions(overrides);
  if (overrides[0] === false) {
    return overrides;
  }
  return base && overrides ? [overrides[0] || base[0], mergeLayoutParameters(base[1], overrides[1])] : (overrides || base);
}

function mergeLayoutParameters(base, overrides) {
  return {
    ...base,
    ...overrides,
    link: { ...(base && base.link), ...(overrides && overrides.link) },
    templates: { ...(base && base.templates), ...(overrides && overrides.templates) },
  };
}
