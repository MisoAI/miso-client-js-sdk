import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-ask';

const ATTR_INDEX = 'index';
const OBSERVED_ATTRIBUTES = Object.freeze([ATTR_INDEX]);

export default class MisoAskElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  _getWorkflow(client) {
    return this._getWorkflowByIndex(client, this.index);
  }

  _getWorkflowByIndex(client, index) {
    return client.ui.asks.get(index);
  }

  // properties //
  get index() {
    const attrValue = this.getAttribute(ATTR_INDEX);
    // TODO
    return attrValue ? Number(attrValue) : 0;
  }

  set index(value) {
    // TODO: special value: 'last'
    if (value !== undefined && typeof value !== 'number') {
      // TODO
      throw new TypeError('index must be undefined or a non-negative integer');
    }
    value = value && `${value}`;
    if (value) {
      this.setAttribute(ATTR_INDEX, value);
    } else {
      this.removeAttribute(ATTR_INDEX);
    }
  }

  // lifecycle //
  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_INDEX:
        this._handleIndexUpdate(oldValue, newValue);
        break;
    }
  }

  _handleIndexUpdate(oldIndex, newIndex) {
    if (oldIndex === newIndex || !this._client) {
      return;
    }
    this._setWorkflow(this._getWorkflowByIndex(this._client, newIndex));
  }

}
