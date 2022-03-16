import { trimObj, emptyObjectToUndefined } from './objects';

// TODO: unit test

export function readPageInfo() {
  return trimObj({
    url: window.location.href,
    referrer: document.referrer,
    title: document.title,
  });
}

export function readUtm() {
  const params = new URLSearchParams(window.location.search);
  let utm = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    name: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  };
  return emptyObjectToUndefined(trimObj(utm));
}
