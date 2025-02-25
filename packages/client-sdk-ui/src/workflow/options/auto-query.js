import { trimObj } from '@miso.ai/commons';
import { ROLE } from '../../constants.js';

export const DEFAULT_AUTO_QUERY_PARAM = 'q';
export const DEFAULT_AUTO_QUERY_SOURCE_PARAM = 'qs';

export function normalizeAutoQueryOptions({ setValue = true, focus = true, updateUrl = true, param = DEFAULT_AUTO_QUERY_PARAM, sourceParam = DEFAULT_AUTO_QUERY_SOURCE_PARAM, ...options } = {}) {
  return { setValue, focus, updateUrl, param, sourceParam, ...options };
}

export function autoQuery(options = {}) {
  // TODO: support getting value from URL path
  const { setValue, focus, param, sourceParam } = this._autoQuery = normalizeAutoQueryOptions(options);
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get(param);
  const qs = searchParams.get(sourceParam) || undefined;
  const { layout } = this._views.get(ROLE.QUERY);
  if (layout) {
    if (q && setValue) {
      layout.value = q;
    }
    if (!q && focus) {
      layout.focus();
    }
  }
  if (q) {
    this.query(trimObj({ q, qs }));
  }
}
