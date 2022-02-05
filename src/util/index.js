export { default as obj$ } from './objq';

// TODO: unit test
export function parseSearchToObject(str) {
  if (str.charAt(0) === '?') {
    str = str.substring(1);
  }
  if (!str.length) {
    return {};
  }
  return str.split('&').reduce((acc, s) => {
    const pair = s.split('=');
    acc[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    return acc;
  }, {});
}
