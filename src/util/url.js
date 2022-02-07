import obj$ from './objq';

// TODO: unit test
export function parseSearchString(str) {
  if (str.charAt(0) === '?') {
    str = str.substring(1);
  }
  if (!str.length) {
    return {};
  }
  return str.split('&').reduce((acc, s) => {
    const pair = s.split('=');
    acc[window.decodeURIComponent(pair[0])] = window.decodeURIComponent(pair[1]);
    return acc;
  }, {});
}

export function readPageInfo() {
  return obj$({
    url: window.location.href,
    referrer: document.referrer,
    title: document.title,
  }).trim().value;
}

export function readUtm() {
  const {utm_source, utm_medium, utm_campaign, utm_term, utm_content} = parseSearchString(window.location.search);
  return obj$({
    source: utm_source,
    medium: utm_medium,
    name: utm_campaign,
    term: utm_term,
    content: utm_content,
  }).trim().emptyToUndefined().value;
}
