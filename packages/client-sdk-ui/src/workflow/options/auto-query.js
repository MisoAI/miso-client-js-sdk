import { trimObj } from '@miso.ai/commons';
import { ROLE, QUESTION_SOURCE } from '../../constants.js';

export const DEFAULT_AUTO_QUERY_PARAM = 'q';
export const DEFAULT_AUTO_QUERY_SOURCE_PARAM = 'qs';

export function normalizeAutoQueryOptions({
  setValue = true,
  focus = true,
  updateUrl = true,
  param = DEFAULT_AUTO_QUERY_PARAM,
  sourceParam = DEFAULT_AUTO_QUERY_SOURCE_PARAM,
  ...options
} = {}) {
  return { setValue, focus, updateUrl, param, sourceParam, ...options };
}

export function autoQuery(options = {}) {
  // TODO: support getting value from URL path
  const { setValue, focus, param, sourceParam } = this._autoQuery = normalizeAutoQueryOptions(options);
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get(param);
  const qs = searchParams.get(sourceParam) || undefined;

  // because it's probably not there yet, but this is an ad-hoc solution
  setTimeout(() => {
    for (const view of this._views.getAll(ROLE.QUERY)) {
      const { layout } = view;
      if (q && setValue) {
        layout.value = q;
      }
      if (!q && focus) {
        layout.focus();
      }
    }
  });

  if (q) {
    this.query(trimObj({ q, qs }));
  }
}

export function updateQueryParametersInUrl({ value, request }) {
  if (!this._autoQuery || !this._autoQuery.updateUrl) {
    return;
  }
  const { param, sourceParam } = this._autoQuery;
  const query = (value && (value.question || value.keyword)) || (request && request.payload && (request.payload.question || request.payload.q));
  const querySource = request && request.payload && request.payload.metadata && request.payload.metadata.question_source;

  if (!query) {
    return; // at initial phase
  }

  const url = new URL(window.location);
  const currentQuery = url.searchParams.get(param);
  const currentQuerySource = url.searchParams.get(sourceParam) || QUESTION_SOURCE.ORGANIC;
  if (query === currentQuery && querySource === currentQuerySource) {
    return;
  }
  url.searchParams.set(param, query);
  if (querySource === QUESTION_SOURCE.ORGANIC) {
    url.searchParams.delete(sourceParam);
  } else {
    url.searchParams.set(sourceParam, querySource);
  }
  window.history.replaceState({}, '', url);
}
