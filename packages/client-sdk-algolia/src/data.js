import { trimObj, mapValues, asArray } from '@miso.ai/commons';
import { buildFilters } from './filter';

const DEFAULT_ROWS = 5;

export function buildPayload(algoliaClient, { indexName, params = {} }) {
  const { payload, query, attributesToRetrieve, ...resrParams } = params;
  checkForUnsupportedParameters(resrParams);
  return trimObj({
    ...payload,
    engine_id: indexName || undefined,
    q: query || '*',
    fl: buildFl(algoliaClient, attributesToRetrieve),
    ...buildPageInfo(params),
    ...buildFilters(algoliaClient, params),
    ...buildFacets(params),
  });
}

const CHAR_DASH = '-'.charCodeAt(0);

function buildFl(algoliaClient, attributesToRetrieve) {
  if (!attributesToRetrieve) {
    return ['*'];
  }
  const fl = [];
  const exclusions = [];
  for (const attr of attributesToRetrieve) {
    if (!attr) {
      continue;
    }
    if (attr.charCodeAt(0) === CHAR_DASH) {
      exclusions.push(attr);
      continue;
    }
    fl.push(attr);
  }
  if (exclusions.length) {
    console.warn(`Exclusion pattern is not supported: ${exclusions.join(', ')}`);
  }
  return fl;
}

function buildPageInfo({ hitsPerPage, page, offset, length }) {
  return {
    rows: hitsPerPage || length || DEFAULT_ROWS,
    start: page && ((hitsPerPage || DEFAULT_ROWS) * page) || offset || undefined,
  };
}

function buildFacets({ facets, maxValuesPerFacet }) {
  facets = asArray(facets);
  if (!facets.length) {
    return undefined;
  }
  if (maxValuesPerFacet) {
    facets = facets.map(prop => ({
      field: prop,
      size: maxValuesPerFacet,
    }));
  }
  return { facets };
}

function checkForUnsupportedParameters(params) {
  // TODO
}



export function transformResponse(algoliaClient, { params = {} }, { products, miso_id, total, took, facet_counts }) {
  const { query, similarQuery, page, hitsPerPage } = params;
  return trimObj({
    hits: products,
    facets: transformResponseFacets(facet_counts),
    page,
    nbHits: total,
    nbPages: Math.ceil(total / (hitsPerPage || DEFAULT_ROWS)),
    hitsPerPage,
    processingTimeMS: took,
    query,
    similarQuery,
    //queryID: miso_id,
    // TODO: params
  });
}

function transformResponseFacets(facet_counts) {
  if (!facet_counts) {
    return undefined;
  }
  const { facet_fields } = facet_counts;
  return mapValues(facet_fields, entriesToObj);
}

function entriesToObj(entries) {
  return entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
}
