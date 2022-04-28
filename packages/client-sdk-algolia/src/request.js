import { trimObj } from '@miso.ai/commons';

// TODO: we may want to keep this on client
const DEFAULT_ROWS = 5;

export function buildPayload(algoliaClient, { indexName, params = {} }) {
  const { query, searchParameters = {} } = params;
  const { page, hitsPerPage, offset, length } = searchParameters;
  return trimObj({
    engine_id: indexName || undefined,
    q: query,
    fl: ['*'],
    rows: hitsPerPage || length || undefined,
    start: page && ((hitsPerPage || DEFAULT_ROWS) * page) || offset || undefined
  });
}
