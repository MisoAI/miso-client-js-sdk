import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-ask';

const ATTR_PARENT_QUESTION_ID = 'parent-question-id';
const OBSERVED_ATTRIBUTES = Object.freeze([
  ...MisoContainerElement.observedAttributes,
  ATTR_PARENT_QUESTION_ID,
]);

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
    value = value !== undefined ? `${value}` : undefined;
    if (value === this.parentQuestionId) {
      return;
    }
    if (value) {
      this.setAttribute(ATTR_PARENT_QUESTION_ID, value);
    } else {
      this.removeAttribute(ATTR_PARENT_QUESTION_ID);
    }
  }

  set workflow(workflow) {
    this._setWorkflow(workflow);
    this.parentQuestionId = workflow && workflow.parentQuestionId;
  }

  // lifecycle //
  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_PARENT_QUESTION_ID:
        this._handleParentQuestionIdUpdate(oldValue, newValue);
        break;
      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }

  _handleParentQuestionIdUpdate(oldId, newId) {
    oldId = oldId || undefined; // null -> undefined
    newId = newId || undefined;
    if (oldId === newId || !this._client) {
      return;
    }
    this._setWorkflow(this._getWorkflowByParentQuestionId(this._client, newId));
  }

}
