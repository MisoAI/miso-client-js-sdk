import MisoContainerElement from './miso-container.js';
import { getContainer } from '../utils.js';

const TAG_NAME = 'miso-message-item';

const ATTR_QUESTION_ID = 'question-id';
const OBSERVED_ATTRIBUTES = Object.freeze([
  ...MisoContainerElement.observedAttributes,
  ATTR_QUESTION_ID,
]);

/**
 * A container element for one message (question-answer pair) of the
 * conversation panel, placed inside <miso-conversation> — a container
 * element inside another container element hosting an item subworkflow (the
 * `message` workflow). Normally bound implicitly: the messages layout
 * renders one <miso-message-item> per item and assigns the workflow off the item
 * binding (element.workflow = parent workflow's getMessageWorkflow(record)),
 * which also covers a just-posted message that has no question id yet. A
 * `question-id` attribute binds explicitly instead, through the parent
 * container's workflow. Role elements inside (question, answer, sources,
 * ...) bind to the message workflow as usual — getContainer() resolves to
 * the closest container ancestor.
 */
export default class MisoMessageItemElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  // properties //
  get questionId() {
    return this.getAttribute(ATTR_QUESTION_ID) || undefined;
  }

  set questionId(value) {
    value = value !== undefined ? `${value}` : undefined;
    if (value === this.questionId) {
      return;
    }
    if (value) {
      this.setAttribute(ATTR_QUESTION_ID, value);
    } else {
      this.removeAttribute(ATTR_QUESTION_ID);
    }
  }

  _getWorkflow(client) {
    const { questionId } = this;
    if (!questionId) {
      // implicitly bound: the messages layout assigns element.workflow off
      // the item binding — keep whatever is (or will be) assigned
      return this._workflow;
    }
    const container = this._getParentContainer();
    const workflow = container && container.workflow;
    // the parent workflow hands out the item subworkflow; the parent binds
    // its own workflow first (its connectedCallback resolves earlier), so
    // it is normally present by now
    return workflow && typeof workflow.getMessageWorkflow === 'function' ? workflow.getMessageWorkflow(questionId) : undefined;
  }

  _getParentContainer() {
    try {
      return this.parentNode ? getContainer(this.parentNode) : undefined;
    } catch (_) {
      return undefined; // not inside a container element
    }
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_QUESTION_ID:
        this._handleQuestionIdUpdate(oldValue, newValue);
        break;
      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }

  _handleQuestionIdUpdate(oldValue, newValue) {
    oldValue = oldValue || undefined; // null -> undefined
    newValue = newValue || undefined;
    if (oldValue === newValue || !this._client) {
      return;
    }
    this._setWorkflow(this._getWorkflow(this._client));
  }

}
