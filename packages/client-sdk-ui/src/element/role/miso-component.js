import { getContainer } from '../utils';

const TAG_NAME = 'miso-component';

const ATTR_ROLE = 'role';

const OBSERVED_ATTRIBUTES = Object.freeze([ATTR_ROLE]);

export default class MisoComponentElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor({
    role,
  } = {}) {
    super();
    if (role) {
      Object.defineProperty(this, '_role', {
        value: role,
        writable: false, // predefined role is immutable
      });
    }
  }

  get role() {
    return this._role;
  }

  // lifecycle //
  connectedCallback() {
    const container = getContainer(this);
    if (this._container && this._container !== container) {
      // clean up, just in case
      this._container._removeComponent(this);
    }
    this._syncRole();
    container._addComponent(this);
    this._container = container;
    this._containerResolution && this._containerResolution.resolve(container);
  }

  _syncRole() {
    const roleAttr = this.getAttribute(ATTR_ROLE);
    if (!roleAttr) {
      if (!this._role) {
        // no predefined role, no role attribute
        throw new Error(`An attribute '${ATTR_ROLE}' is required for element <${this.tagName}>`);
      }
      return; // has predefined role, no role attribute: we're all good
    } else {
      if (this._role) {
        // both predefined role and role attribute, ignore the latter and give a warning
        console.warn(`Element <${this.tagName}>' already has a predefined role '${this._role}', so attribute '${ATTR_ROLE}="${roleAttr}"' is ignored.`);
      } else {
        // no predefined role, has role attribute: assign the role
        this._role = roleAttr;
      }
    } 
  }

  disconnectedCallback() {
    if (!this._container) {
      return;
    }
    this._container._removeComponent(this);
    this._container = undefined;
    this._containerResolution = undefined;
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (attr === ATTR_ROLE) {
      this._container && this._container._updateComponentRole(this, oldValue, newValue);
    }
  }

}
