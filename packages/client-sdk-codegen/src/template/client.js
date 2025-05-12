import { indent, blocks } from './helpers.js';

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
