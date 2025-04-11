export function encodeParameters(params = {}) {
  // JSON string -> base64
  return base64Encode(JSON.stringify(params));
}

export function decodeParameters(params) {
  // base64 -> JSON string
  return params ? JSON.parse(base64Decode(params)) : {};
}

function base64Encode(str) {
  return typeof window !== 'undefined' ? window.btoa(str) : Buffer.from(str).toString('base64');
}

function base64Decode(str) {
  return typeof window !== 'undefined' ? window.atob(str) : Buffer.from(str, 'base64').toString();
}
