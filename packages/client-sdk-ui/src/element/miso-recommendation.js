import { ROLE } from '../constants';
import { getClient } from './utils';

const TAG_NAME = 'miso-recommendation';

const ATTR_UNIT_ID = 'unit-id';
const OBSERVED_ATTRIBUTES = Object.freeze([ATTR_UNIT_ID]);

export default class MisoRecommendationElement extends HTMLElement {

  static get role() {
    return ROLE.RESULTS;
  }

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
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
    const client = await getClient();
    client.ui.recommendation.get(this.unitId).bind(this);
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
    const { recommendation } = this._client.ui;
    if (oldValue && recommendation.has(oldValue)) {
      recommendation.get(oldValue).unbind();
    }
    if (newValue) {
      recommendation.get(newValue).bind(this);
    }
  }

}
