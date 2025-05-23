import MisoContainerElement from './miso-container.js';

const ATTR_UNIT_ID = 'unit-id';
const OBSERVED_ATTRIBUTES = Object.freeze([
  ...MisoContainerElement.observedAttributes,
  ATTR_UNIT_ID,
]);

export default class MisoUnitElement extends MisoContainerElement {

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  _getWorkflow(client) {
    return this._getWorkflowByUnitId(client, this.unitId);
  }

  _getWorkflowByUnitId(client, unitId) {
    throw new Error('Not implemented');
  }

  // properties //
  get unitId() {
    return this.getAttribute(ATTR_UNIT_ID) || undefined;
  }

  set unitId(value) {
    value = value && `${value}`;
    if (value) {
      this.setAttribute(ATTR_UNIT_ID, value);
    } else {
      this.removeAttribute(ATTR_UNIT_ID);
    }
  }

  // lifecycle //
  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_UNIT_ID:
        this._handleUnitIdUpdate(oldValue, newValue);
        break;
      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }

  _handleUnitIdUpdate(oldUnitId, newUnitId) {
    if (oldUnitId === newUnitId || !this._client) {
      return;
    }
    this._setWorkflow(this._getWorkflowByUnitId(this._client, newUnitId));
  }

}
