import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-ask';

const ATTR_PARENT_QUESTION_ID = 'parent-question-id';
const OBSERVED_ATTRIBUTES = Object.freeze([ATTR_PARENT_QUESTION_ID]);

export default class MisoAskElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  _getWorkflow(client) {
    return this._getWorkflowByParentQuestionId(client, this.parentQuestionId);
  }

  _getWorkflowByParentQuestionId(client, id) {
    return client.ui.asks.getByParentQuestionId(id, { autoCreate: true });
  }

  // properties //
  get parentQuestionId() {
    return this.getAttribute(ATTR_PARENT_QUESTION_ID) || undefined;
  }

  set parentQuestionId(value) {
    value = value && `${value}`;
    if (value) {
      this.setAttribute(ATTR_PARENT_QUESTION_ID, value);
    } else {
      this.removeAttribute(ATTR_PARENT_QUESTION_ID);
    }
  }

  // lifecycle //
  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_PARENT_QUESTION_ID:
        this._handleParentQuestionIdUpdate(oldValue, newValue);
        break;
    }
  }

  _handleParentQuestionIdUpdate(oldId, newId) {
    if (oldId === newId || !this._client) {
      return;
    }
    this._setWorkflow(this._getWorkflowByParentQuestionId(this._client, newId));
  }

}
