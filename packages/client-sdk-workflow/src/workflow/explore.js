/** @module workflow */

import UnitWorkflow from './unit.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { enableUseLink, UseLinkMixin } from './use-link.js';
import { makeAutocompletable } from './autocompletable.js';

const ROLES_OPTIONS = mergeRolesOptions(UnitWorkflow.ROLES_OPTIONS, {
  main: ROLE.RELATED_QUESTIONS,
  members: [ROLE.RELATED_QUESTIONS, ROLE.QUERY],
});

/**
 * The workflow of an explore unit, which shows related questions, and a
 * search box to ask a question, on a page other than the answer page.
 * Get one from `client.workflows.explores`, or the default one from
 * `client.workflows.explore`.
 *
 * Questions go to the answer page, by the URL given by the link function set
 * by `useLink()`. Clicking a related question emits a `select` event.
 *
 * @extends module:workflow~UnitWorkflow
 * @mixes module:workflow~Linkable
 * @example
 * const workflow = client.workflows.explore;
 * workflow.useLink(q => `/answer?q=${encodeURIComponent(q)}`);
 * workflow.start();
 */
class Explore extends UnitWorkflow {

  constructor(context, id) {
    super({
      name: 'explore',
      context,
      roles: ROLES_OPTIONS,
      id,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._initAutocomplete(args);
    this._productId = undefined;
    this._linkFn = undefined;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.on(ROLE.RELATED_QUESTIONS, 'click', event => this._onRelatedQuestionsClick(event)),
      this._views.on(ROLE.QUERY, 'submit', event => this._onQuerySubmit(event)),
      this._hub.on(fields.query(), args => this._query(args)),
    ];
  }

  // configuration //
  /**
   * @deprecated Use `useApi({ product_id })` instead.
   * @type {string}
   */
  set productId(value) {
    console.warning('DEPRECATED: use useApi() instead');
    this.useApi({
      product_id: value,
    });
  }

  // the product id is remembered, to be written on the generated question
  // links as the question source
  useApi(...args) {
    const options = (typeof args[0] === 'object' ? args[0] : args[1]) || {};
    const { product_id } = options;
    if (product_id) {
      this._productId = product_id;
    }
    return super.useApi(...args);
  }

  /**
   * Set the function giving the URL of the answer page for a question.
   * Required before `start()`.
   *
   * @param {Function} fn - Takes the question and returns the URL.
   * @param {Object} [options]
   * @param {boolean} [options.showUrl] - Show the URLs on the related question links.
   * @param {boolean} [options.open] - Set to `false` to navigate in the current window,
   *   instead of opening a new one.
   * @param {string} [options.target='_blank'] - The target of the new window.
   * @param {string} [options.windowFeatures='noopener'] - The features of the new window.
   * @returns {this}
   */
  useLink(fn, options) {
    UseLinkMixin.prototype.useLink.call(this, fn, options);
    // also put options to layouts
    if (options) {
      this.useLayouts({
        [ROLE.RELATED_QUESTIONS]: { link: options },
      });
    }
    return this;
  }

  // lifecycle //
  /**
   * Start the workflow, loading the related questions.
   *
   * @param {Object} [options]
   * @param {boolean} [options.relatedQuestions=true] - Set to `false` to skip loading related questions.
   * @returns {this}
   * @throws {Error} If `useLink()` is not called yet.
   */
  start({ relatedQuestions = true } = {}) {
    if (this._linkFn === undefined) {
      throw new Error('Must define link mapping function with useLink(fn) before calling start()');
    }
    // in explore workflow, start() triggers query
    // TODO: we should still make the query lifecycle
    if (relatedQuestions) {
      this._request();
    } else {
      // TODO: ad-hoc
      const { session } = this;
      this.updateData({ session, request: {}, value: { related_questions: [] } });
    }
    return this;
  }

  notifyViewUpdate(role = ROLE.RELATED_QUESTIONS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    data = this._addUrlToRelatedQuestions(data);
    return data;
  }

  _addUrlToRelatedQuestions(data) {
    const { value } = data;
    if (!value || !value.related_questions) {
      return data;
    }
    const [linkFn, linkOptions = {}] = this._linkFn || [];
    const getDisplayedUrl = text => linkFn && linkOptions.showUrl ? this._getSubmitUrl({ q: text, generated: true }) : '#';
    const related_questions = value.related_questions.map(text => ({
      text,
      url: getDisplayedUrl(text),
    }));
    return {
      ...data,
      value: {
        ...value,
        related_questions,
      },
    };
  }

  _onRelatedQuestionsClick({ value: question, ...event }) {
    this._events.emit('select', Object.freeze({ ...event, question }));
    const [linkFn, linkOptions = {}] = this._linkFn || [];
    if (!linkFn || !linkOptions.showUrl) {
      event.domEvent && event.domEvent.preventDefault();
    }
    if (linkFn && !linkOptions.showUrl) {
      this._submitToPage({ q: question.text, generated: true });
    }
  }

  _onQuerySubmit({ value }) {
    this.query({ q: value });
  }

  /**
   * Go to the answer page of a question, by the URL given by the link
   * function.
   *
   * @param {Object} args
   * @param {string} args.q - The question.
   */
  query(args) {
    if (!args.q) {
      throw new Error(`q is required in query() call`);
    }
    this._hub.update(fields.query(), args);
  }

  _query(args) {
    this._submitToPage({ ...args, generated: false });
  }

  _getSubmitUrl(args) {
    // TODO: if trending_questions -> qs = '_trending'
    let url = UseLinkMixin.prototype._getSubmitUrl.call(this, args);
    if (!args.generated || !this._productId) {
      return url;
    }
    return `${url}&qs=${encodeURIComponent(this._productId)}`;
  }

}

enableUseLink(Explore.prototype);
makeAutocompletable(Explore.prototype);

export default Explore;
