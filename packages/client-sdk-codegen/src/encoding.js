export function encodeConfig(params) {
  if (params === undefined || params === null) {
    return undefined;
  }
  if (typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  // JSON string -> base64
  return base64Encode(JSON.stringify(params));
}

export function decodeConfig(params) {
  if (params === undefined || params === null) {
    return undefined;
  }
  // base64 -> JSON string
  return JSON.parse(base64Decode(params));
}

function base64Encode(str) {
  return typeof window !== 'undefined' ? window.btoa(str) : Buffer.from(str).toString('base64');
}

function base64Decode(str) {
  return typeof window !== 'undefined' ? window.atob(str) : Buffer.from(str, 'base64').toString();
}
