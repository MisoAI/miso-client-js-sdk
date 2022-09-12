export function addUrlParameter(url, key, value) {
  if (typeof key !== 'string') {
    throw new Error(`Expect URL parameter to be a string: ${key}`);
  }
  if (value === undefined) {
    value = '1';
  }
  return url + (url.indexOf('?') < 0 ? '?' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(`${value}`);
}
