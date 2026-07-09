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

export default class Explore extends UnitWorkflow {

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
      this._views.on(ROLE.RELATED_QUESTIONS, 'click', event => this._handleRelatedQuestionClick(event)),
      this._hub.on(fields.query(), args => this._query(args)),
    ];
  }

  // configuration //
  set productId(value) {
    console.warning('DEPRECATED: use useApi() instead');
    this.useApi({
      product_id: value,
    });
  }

  useApi(...args) {
    const options = (typeof args[0] === 'object' ? args[0] : args[1]) || {};
    const { product_id } = options;
    if (product_id) {
      this._productId = product_id;
    }
    return super.useApi(...args);
  }

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

  _handleRelatedQuestionClick({ value: question, ...event }) {
    this._events.emit('select', Object.freeze({ ...event, question }));
    const [linkFn, linkOptions = {}] = this._linkFn || [];
    if (!linkFn || !linkOptions.showUrl) {
      event.domEvent && event.domEvent.preventDefault();
    }
    if (linkFn && !linkOptions.showUrl) {
      this._submitToPage({ q: question.text, generated: true });
    }
  }

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
