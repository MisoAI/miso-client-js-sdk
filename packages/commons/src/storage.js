export function getOrComputeFromStorage(name, compute) {
  const localStorageValue = window.localStorage.getItem(name);
  const cookieValue = getCookie(name);
  const value = localStorageValue || cookieValue || `${compute()}`;
  if (value && !localStorageValue) {
    window.localStorage.setItem(name, value);
  }
  if (value && !cookieValue) {
    setCookie(name, value);
  }
  return value;
}

export function getCookie(name) {
  const c = `; ${document.cookie}`;
  const ref = `; ${encodeURIComponent(name)}=`;
  const i = c.indexOf(ref);
  if (i < 0) {
    return undefined;
  }
  const j = i + ref.length;
  const k = c.indexOf(';', j);
  return decodeURIComponent(k < 0 ? c.substring(j) : c.substring(j, k));
}

export function setCookie(name, value) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=31536000; path=/`;
}
