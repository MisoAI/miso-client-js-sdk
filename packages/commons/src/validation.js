export function assertNullableFunction(value, msg) {
  if (value !== undefined && typeof value !== 'function') {
    throw new Error(msg(value));
  }
  return value;
}
