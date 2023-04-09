export function mergeApiParams(base = {}, overrides = {}) {
  return Object.freeze({
    ...base,
    ...overrides,
    payload: Object.freeze({
      ...base.payload,
      ...overrides.payload,
    })
  });
}
