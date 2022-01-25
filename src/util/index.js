export function trimObj(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

export function nullifyIfEmptyObj(obj) {
  return Object.keys(obj).length === 0 ? undefined : obj;
}

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
