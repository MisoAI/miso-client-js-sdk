export function mergeRolesOptions(base, overrides) {
  return Object.freeze({
    ...base,
    ...overrides,
    members: mergeRolesMembers(base.members, overrides.members),
    mappings: Object.freeze({ ...base.mappings, ...overrides.mappings }),
  });
}

function mergeRolesMembers(base = [], overrides = []) {
  return [...new Set([...base, ...overrides])];
}
