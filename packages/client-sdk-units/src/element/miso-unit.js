import { getMisoClient } from './utils';

const ATTR_UNIT_ID = 'unit-id';
const TAG_NAME = 'miso-unit';
const OBSERVED_ATTRIBUTES = Object.freeze([ATTR_UNIT_ID]);

export default class MisoUnitElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super();
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
  async connectedCallback() {
    // find client & auto bind
    const MisoClient = await getMisoClient();
    const client = this._client = await MisoClient.any();
    client.units.get(this.unitId).bind(this);
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_UNIT_ID:
        this._handleUnitIdUpdate(oldValue, newValue);
        break;
    }
  }

  _handleUnitIdUpdate(oldValue, newValue) {
    if (oldValue === newValue || !this._client) {
      return;
    }
    const units = this._client.units;
    if (oldValue && units.has(oldValue)) {
      units.get(oldValue).unbind();
    }
    if (newValue) {
      units.get(newValue).bind(this);
    }
  }

  /*
  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }
  */

}
