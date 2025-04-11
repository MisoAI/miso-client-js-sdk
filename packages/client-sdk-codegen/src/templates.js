import { indent } from './utils.js';

export function misocmd(body) {
  return `
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
${indent(body, 2)}
});
`.trim();
}

export function createClient(options) {
  return `
// client
const MisoClient = window.MisoClient;
const client = new MisoClient(${clientOptions(options)});
`.trim();
}

function clientOptions({ apiKey, apiKeyParam = false } = {}) {
  if (!apiKeyParam) {
    return `'${apiKey}'`;
  }
  apiKeyParam = apiKeyParam === true ? 'api-key' : apiKeyParam;
  return `new URLSearchParams(window.location.search).get('${apiKeyParam}') || '${apiKey}'`;
}
