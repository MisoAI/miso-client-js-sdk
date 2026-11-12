/** @module workflow */

import { mixin } from '@miso.ai/commons';

// TODO: eliminate browser dependency

// mixes in useLink(): keep in sync with the Linkable mixin docs at the
// bottom of this file
export function enableUseLink(prototype) {
  mixin(prototype, UseLinkMixin.prototype);
}

export class UseLinkMixin {

  useLink(fn, options = {}) {
    if (typeof fn !== 'function' && fn !== false) {
      throw new Error('useLink(fn) expects fn to be a function or false');
    }
    this._linkFn = fn ? [fn, options] : false;
    return this;
  }

  _submitToPage(args = {}) {
    if (!this._linkFn) {
      return;
    }
    const url = this._getSubmitUrl(args);
    const [_, options = {}] = this._linkFn;
    if (options.open === false) {
      window.location.href = url;
    } else {
      const target = options.target || '_blank';
      const windowFeatures = options.windowFeatures || 'noopener';
      window.open(url, target, windowFeatures);
    }
  }

  _getSubmitUrl({ q, ...args } = {}) {
    if (!this._linkFn) {
      throw new Error('useLink(fn) must be called before _getSubmitUrl()');
    }
    return this._linkFn[0](q, args);
  }

}

// docs //
// useLink() is mixed in by enableUseLink(), documented as a JSDoc mixin

/**
 * The method to send queries to another page, such as a search results
 * page, instead of running them on the current page.
 *
 * @mixin module:workflow~Linkable
 */

/**
 * Set the function giving the URL of the page to send a query to. Once set,
 * `query()` goes to that URL instead of running the query.
 *
 * @function useLink
 * @memberof module:workflow~Linkable
 * @param {Function|false} fn - Takes the query and returns the URL. Pass
 *   `false` to run queries on the current page again.
 * @param {Object} [options]
 * @param {boolean} [options.open] - Set to `false` to navigate in the current window,
 *   instead of opening a new one.
 * @param {string} [options.target='_blank'] - The target of the new window.
 * @param {string} [options.windowFeatures='noopener'] - The features of the new window.
 * @returns {this}
 * @example
 * workflow.useLink(q => `/search?q=${encodeURIComponent(q)}`);
 */
