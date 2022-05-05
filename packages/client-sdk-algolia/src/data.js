import { trimObj, mapValues, asArray } from '@miso.ai/commons';
import { buildFilters } from './filter';

const DEFAULT_ROWS = 5;

export function buildPayload(algoliaClient, { engine_id, query, params = {} }) {
  const { payload, query: queryFromParams, attributesToRetrieve, ...resrParams } = params;
  checkForUnsupportedParameters(resrParams);
  return trimObj({
    ...payload,
    engine_id: engine_id || undefined,
    q: query || queryFromParams || '*',
    fl: buildFl(algoliaClient, attributesToRetrieve),
    ...buildPageInfo(params),
    ...buildFilters(algoliaClient, params),
    ...buildFacets(params),
    ...buildForAutoComplete(params),
  });
}

function checkForUnsupportedParameters({
  attributesToSnippet, snippetEllipsisText, restrictHighlightAndSnippetArrays,
  ...params
}) {
  // TODO
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
  // TODO: we may want to hack hitsPerPage if completion_fields is present
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

function buildForAutoComplete({ attributesToHighlight, highlightPreTag, highlightPostTag }) {
  for (const attr of (attributesToHighlight || [])) {
    if (attr === '*') {
      throw new Error(`attributesToHighlight = ['*'] is not supported.`);
    }
  }
  return {
    completion_fields: attributesToHighlight || undefined,
  };
}



export function transformResponse(algoliaClient, { apiName, params = {} }, response) {
  const { query, page, hitsPerPage } = params;
  const { miso_id, total, took, facet_counts } = response;
  return trimObj({
    hits: transformHits(apiName, params, response),
    facets: transformResponseFacets(facet_counts),
    page,
    nbHits: total,
    nbPages: Math.ceil(total / (hitsPerPage || DEFAULT_ROWS)),
    hitsPerPage,
    processingTimeMS: took,
    query,
    //queryID: miso_id,
    // TODO: params
  });
}

function transformHits(apiName, params, response) {
  switch (apiName) {
    case 'autocomplete':
      return transformCompletionsToHits(params, response);
    case 'search':
    default:
      return response.products;
  }
}

const MISO_MARK_PRE_TAG = '<mark>';
const MISO_MARK_POST_TAG = '</mark>';
const MISO_MARK_REGEXP = new RegExp(`${MISO_MARK_PRE_TAG}|${MISO_MARK_POST_TAG}`, 'g');

function transformCompletionsToHits({ query, highlightPreTag = '<em>', highlightPostTag = '</em>' }, { completions }) {
  const hits = [];
  for (const _attribute in completions) {
    for (const { product, text, text_with_markups, text_with_inverted_markups: marked } of completions[_attribute]) {
      const hasMark = marked.indexOf(MISO_MARK_PRE_TAG) > -1;
      hits.push(trimObj({
        ...product,
        _attribute,
        _text: text,
        _text_with_markups: text_with_markups,
        _text_with_inverted_markups: marked,
        _highlightResult: {
          [_attribute]: {
            matchLevel: hasMark ? 'full' : 'none',
            matchedWords: hasMark ? [ query ] : [],
            value: marked.replaceAll(MISO_MARK_REGEXP, tag => tag === MISO_MARK_PRE_TAG ? highlightPreTag : highlightPostTag),
          },
        },
      }));
    }
  }
  return hits;
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
