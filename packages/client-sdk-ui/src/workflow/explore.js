import { API } from '@miso.ai/commons';
import Workflow from './base.js';
import { mergeApiOptions } from './options.js';
import { fields } from '../actor/index.js';
import { ROLE, EVENT_TYPE } from '../constants.js';
import { ListLayout, SearchBoxLayout } from '../layout/index.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.ASK,
  name: API.NAME.RELATED_QUESTIONS,
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.RELATED_QUESTIONS]: [ListLayout.type, { itemType: 'question', link: { rel: 'noopener nofollow' } }],
  [ROLE.QUERY]: [SearchBoxLayout.type, { placeholder: 'Ask a question' }],
});

const DEFAULT_TRACKERS = Object.freeze({
  [ROLE.RELATED_QUESTIONS]: {},
  [ROLE.CONTAINER]: {},
  [ROLE.QUERY]: {
    [EVENT_TYPE.SUBMIT]: {},
  },
});

const DEFAULT_OPTIONS = Object.freeze({
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

export default class Explore extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'explore',
      plugin,
      client,
      roles: Object.keys(DEFAULT_LAYOUTS),
      defaults: DEFAULT_OPTIONS,
    });
    this._productId = undefined;
    this._linkFn = undefined;

    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.get(ROLE.RELATED_QUESTIONS).on('click', event => this._handleRelatedQuestionClick(event)),
      this._hub.on(fields.query(), payload => this.query(payload)),
    ];

    this.reset();
  }

  set productId(value) {
    console.warning('DEPRECATED: use useApi() instead');
    this.useApi({
      product_id: value,
    });
  }

  useApi(options) {
    const { product_id } = options;
    if (product_id) {
      this._productId = product_id;
    }
    return super.useApi(options);
  }

  useLink(fn) {
    if (typeof fn !== 'function' && fn !== false) {
      throw new Error('useLink(fn) expects fn to be a function or false');
    }
    this._linkFn = fn;
    return this;
  }

  // lifecycle //
  start({ relatedQuestions = true } = {}) {
    if (relatedQuestions && this._linkFn === undefined) {
      throw new Error('Define link mapping function before calling start()');
    }
    this._sessions.start();
    // in explore workflow, start() triggers query
    // TODO: we should still make the query lifecycle
    const { session } = this;
    if (relatedQuestions) {
      this._hub.update(fields.request(), mergeApiOptions(this._options.resolved.api, { session }));
    } else {
      // TODO: ad-hoc
      this.updateData({ session, request: {}, value: { related_questions: [] } });
    }
    return this;
  }

  notifyViewUpdate(role = ROLE.RELATED_QUESTIONS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    let { value } = data;
    if (!value) {
      return data;
    }
    // patch value with links
    const related_questions = value.related_questions.map(this._linkFn ? (text => ({ text, url: this._getAnswersUrl(text, true) })) : (text => ({ text })));
    return {
      ...data,
      value: {
        ...value,
        related_questions,
      },
    };
  }

  _handleRelatedQuestionClick({ value: question, ...event }) {
    this._events.emit('select', Object.freeze({ ...event, question }));
  }

  query({ q } = {}) {
    if (!this._linkFn) {
      return;
    }
    const url = this._getAnswersUrl(q);
    window.open(url, '_blank');
  }

  _getAnswersUrl(text, generated = false) {
    if (!this._linkFn) {
      return;
    }
    const url = this._linkFn(text);
    if (!generated || !this._productId) {
      return url;
    }
    return `${url}&qs=${encodeURIComponent(this._productId)}`;
  }

}
