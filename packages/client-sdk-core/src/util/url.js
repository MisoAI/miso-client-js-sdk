import { trimObj } from '@miso.ai/commons/dist/es/objects';

// TODO: not utils, move away, make a plugin
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
  let utm = trimObj({
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    name: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  });
  return Object.keys(utm).length === 0 ? undefined : utm;
}
