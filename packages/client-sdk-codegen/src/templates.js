import { indent, blocks } from './utils.js';

export function misocmd(body) {
  return `
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
${indent(body, 2)}
});
`.trim();
}

export function pw() {
  return `if (window._pw$) { await window._pw$; }`;
}

export function createClient(options) {
  return blocks(
    `const MisoClient = window.MisoClient;`,
    ...clientPlugins(options),
    `const client = new MisoClient(${clientOptions(options)});`
  );
}

function clientPlugins(options) {
  const blocks = [];
  if (options.dryRun) {
    blocks.push(`MisoClient.plugins.use("std:dry-run");`);
  }
  return blocks;
}

function clientOptions({ apiKey, apiKeyParam = false } = {}) {
  if (!apiKeyParam) {
    return `'${apiKey}'`;
  }
  apiKeyParam = apiKeyParam === true ? 'api-key' : apiKeyParam;
  return `new URLSearchParams(window.location.search).get('${apiKeyParam}') || '${apiKey}'`;
}
