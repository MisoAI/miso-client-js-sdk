import { trimObj } from '@miso.ai/commons';
import shadow from './shadow';

export function buildFilters(algoliaClient, params) {
  const fq = [
    translateFilters(algoliaClient, params),
    translateNumericFilters(algoliaClient, params),
    translateTagFilters(algoliaClient, params),
    translateFacetFilters(algoliaClient, params),
  ].filter(s => s).join(' AND ') || undefined;

  const boost_fq = translateOptionalFilters(algoliaClient, params) || undefined;

  return trimObj({ fq, boost_fq });
}

const CHAR_MINUS = '-'.charCodeAt(0);
const NUMERIC_REGEXP = /(?:\d*\.)?\d+/g; // e.g. 123, .45, 67.89
const QUOTED_REGEXP = /'\d+'/g;
const WORD_REGEXP = /\w+/g;
const LITERAL_REGEXP = new RegExp(`(?:${WORD_REGEXP.source})|(?:${NUMERIC_REGEXP.source})|(?:${QUOTED_REGEXP.source})`, 'g');
const COND_LB_REGEXP = /\b(?:(?:AND|OR|NOT)\s+)|\(\s*|^/g;
const COND_RB_REGEXP = /(?:\s+(?:AND|OR))\b|\s*\)|$/g;

const NUMERIC_COMPARISON_REGEXP = new RegExp(`(?<attr>${LITERAL_REGEXP.source})\\s*(?<op>=|!=|<=|<|>=|>)\\s*(?<value>${NUMERIC_REGEXP.source})`, 'g');
const NUMERIC_RANGE_REGEXP = new RegExp(`(?<attr>${LITERAL_REGEXP.source}):(?<valueX>${NUMERIC_REGEXP.source})\\s+TO\\s+(?<valueY>${NUMERIC_REGEXP.source})`, 'g');
const NUMERIC_RANGE_SOLR_FORMAT = '$<attr>:[$<valueX> TO $<valueY>]';
const TAG_REGEXP = new RegExp(`(?<intro>${COND_LB_REGEXP.source})(?:_tags:)?(?<value>${LITERAL_REGEXP.source})(?<outro>${COND_RB_REGEXP.source})`, 'g');
const TAG_SOLR_FORMAT = '$<intro>tags:$<attr>$<outro>';
const FACET_FILTER_REGEXP = new RegExp(`[(?<expr>${LITERAL_REGEXP.source}:${LITERAL_REGEXP.source})]`, 'g');

// we only take care of "AND|OR NOT attr:value", but that should be enough
// TODO: we can find AND|OR followed by NOT and then search for pairing ()
const BARE_NOT_REGEXP = new RegExp(`\b(?<intro>AND|OR)\\s+NOT\\s+(?<expr>${LITERAL_REGEXP.source}:${LITERAL_REGEXP.source})`, 'g');
const NOT_SOLR_FORMAT = '$<intro>\\sNOT\\s<expr>';

function translateFilters(algoliaClient, { filters }) {
  try {
    return translateFiltersExpr(filters);
  } catch (e) {
    reportError(algoliaClient, 'filters', filters, e);
  }
}

function translateNumericFilters(algoliaClient, { numericFilters }) {
  try {
    return translateConjunctiveFilters(numericFilters, translateNumericFilterExpr);
  } catch (e) {
    reportError(algoliaClient, 'numericFilters', numericFilters, e);
  }
}

function translateTagFilters(algoliaClient, { tagFilters }) {
  try {
    return translateConjunctiveFilters(tagFilters, translateTagFilterExpr);
  } catch (e) {
    reportError(algoliaClient, 'tagFilters', tagFilters, e);
  }
}

function translateFacetFilters(algoliaClient, { facetFilters }) {
  try {
    return translateConjunctiveFilters(facetFilters, translateFacetFilterExpr);
  } catch (e) {
    reportError(algoliaClient, 'facetFilters', facetFilters, e);
  }
}

function translateOptionalFilters(algoliaClient, { optionalFilters }) {
  try {
    return translateConjunctiveFilters(optionalFilters);
  } catch (e) {
    reportError(algoliaClient, 'optionalFilters', optionalFilters, e);
  }
}

export function translateFiltersExpr(expr) {
  if (!expr) {
    return '';
  }
  return shadow(expr)
    // attr < number  -> attr:[* TO number}
    // attr <= number -> attr:[* TO number]
    // attr > number  -> attr:{number TO *]
    // attr >= number -> attr:[number TO *]
    // attr = number  -> attr:number
    // attr != number -> (NOT attr:number)
    .replaceAll(NUMERIC_COMPARISON_REGEXP, (...args) => buildNumericComparisonSolrExpr(group(args)))
    // attr:x TO y -> attr:[x TO y]
    .replaceAll(NUMERIC_RANGE_REGEXP, NUMERIC_RANGE_SOLR_FORMAT)
    // _tags:value -> tags:value
    // value       -> tags:value
    .replaceAll(TAG_REGEXP, TAG_SOLR_FORMAT)
    // [attr:value] -> attr:value
    .replaceAll(FACET_FILTER_REGEXP, (...args) => group(args).expr)
    // AND|OR NOT attr:value -> AND|OR (NOT attr:value)
    .replaceAll(BARE_NOT_REGEXP, NOT_SOLR_FORMAT)
    .unshadow();
}

function translateConjunctiveFilters(filters, translate) {
  return filters && filters.length ? filters.map(f => translateDisjunctiveFilters(f, translate)).join(' AND ') : '';
}

function translateDisjunctiveFilters(filters, translate = v => v) {
  return !Array.isArray(filters) ? translate(filters) :
    !filters.length ? '' :
    filters.length === 1 ? translate(filters[0]) :
    `(${filters.map(translate).join(' OR ')})`;
}

function translateTagFilterExpr(expr) {
  // value -> tags:value
  return `tags:${expr.trim()}`;
}

function translateNumericFilterExpr(expr) {
  return shadow(expr.trim())
    // attr < number  -> attr:[* TO number}
    // attr <= number -> attr:[* TO number]
    // attr > number  -> attr:{number TO *]
    // attr >= number -> attr:[number TO *]
    // attr = number  -> attr:number
    // attr != number -> (NOT attr:number)
    .replaceAll(NUMERIC_COMPARISON_REGEXP, (...args) => buildNumericComparisonSolrExpr(group(args)))
    // attr:x TO y    -> attr:[x TO y]
    .replaceAll(NUMERIC_RANGE_REGEXP, NUMERIC_RANGE_SOLR_FORMAT)
    .unshadow();
}

function translateFacetFilterExpr(expr) {
  // attr:-value -> (NOT attr:value)
  // attr:\-value -> attr:"-value"
  return shadow(expr.trim())
    .map(expr => {
      const [attr, value] = expr.split(':');
      return value.charCodeAt(0) === CHAR_MINUS ? `(NOT ${attr}:${value})` :
        value.startsWith('\\-') ? `${attr}:"${value}"` : expr;
    })
    .unshadow();
}

function buildNumericComparisonSolrExpr({ attr, op, value }) {
  switch (op) {
    case '=':
      return `${attr}:${value}`;
    case '!=':
      return `(NOT ${attr}:${value})`;
    case '<=':
      return `${attr}:[* TO ${value}]`;
    case '<':
      return `${attr}:[* TO ${value}}`;
    case '>=':
      return `${attr}:[${value} TO *]`;
    case '>':
      return `${attr}:{${value} TO *]`;
    default:
      throw new Error(`Unrecognized operator: ${op}`);
  }
}

function group(args) {
  return args[args.length - 1];
}

function reportError(algoliaClient, field, filters, error) {
  console.error(`Error translating ${field} in search parameters: ${JSON.stringify(filters)}`);
  console.error(error);
  throw error;
}
