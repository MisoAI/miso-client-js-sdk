import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-ask';

const ATTR_WORKFLOW = 'workflow';
const ATTR_PARENT_QUESTION_ID = 'parent-question-id';
const OBSERVED_ATTRIBUTES = Object.freeze([
  ...MisoContainerElement.observedAttributes,
  ATTR_WORKFLOW,
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
    if (this.boundToActiveWorkflow) {
      return client.ui.asks.active;
    }
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

  get boundToActiveWorkflow() {
    return this.getAttribute(ATTR_WORKFLOW) === 'active';
  }

  _setWorkflow(workflow) {
    if (this._workflow === workflow) {
      return;
    }
    super._setWorkflow(workflow);
    if (workflow) {
      this.parentQuestionId = workflow.parentQuestionId;
    }
  }

  // lifecycle //
  async connectedCallback() {
    await super.connectedCallback();
    if (document.body.contains(this)) { // in case already disconnected
      const context = this._client.ui.asks;
      this._unsubscribes = [
        ...(this._unsubscribes || []),
        context.on('active', (event) => {
          if (!this.boundToActiveWorkflow) {
            return;
          }
          this.workflow = event.workflow;
        }),
      ];
    }
  }

  disconnectedCallback() {
    for (const unsubscribe of (this._unsubscribes || [])) {
      unsubscribe();
    }
    this._unsubscribes = [];
    super.disconnectedCallback();
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_PARENT_QUESTION_ID:
        this._handleParentQuestionIdUpdate(oldValue, newValue);
        break;
      case ATTR_WORKFLOW:
        this._handleQuestionUpdate(oldValue, newValue);
        break;
      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }

  _handleQuestionUpdate(oldValue, newValue) {
    oldValue = oldValue || undefined; // null -> undefined
    newValue = newValue || undefined;
    if (oldValue === newValue || !this._client) {
      return;
    }
    if (newValue === ATTR_VALUE_ACTIVE) {
      this._setWorkflow(this._getWorkflow(this._client));
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
