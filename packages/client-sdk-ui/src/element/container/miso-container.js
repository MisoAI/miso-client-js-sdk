import { ROLE } from '../../constants.js';
import MisoStubElement from '../util/miso-stub.js';
import { getClient } from '../utils.js';

const ATTR_LOGO = 'logo';
const DEFAULT_LOGO_VALUE = 'auto';
const OBSERVED_ATTRIBUTES = Object.freeze([
  ...MisoStubElement.observedAttributes,
  ATTR_LOGO,
]);

function logoAttrToProp(value) {
  if (!value) {
    return DEFAULT_LOGO_VALUE;
  }
  switch (value) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      throw new Error(`Invalid logo attribute value: ${value}.`);
  }
}

function logoPropToAttr(value) {
  switch (value) {
    case DEFAULT_LOGO_VALUE:
      return undefined;
    case true:
      return 'true';
    case false:
      return 'false';
    default:
      throw new Error(`Invalid logo property value: ${value}.`);
  }
}

export default class MisoContainerElement extends MisoStubElement {

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super();
    this._workflow = undefined;
    this._components = new Set();
  }

  // properties //
  get isContainer() {
    return true;
  }

  get role() {
    return ROLE.CONTAINER;
  }

  get workflow() {
    return this._workflow;
  }

  set workflow(workflow) {
    // An explicit assignment wins over the default this container would pick up
    // on connect. Without this, several searches on one page are not possible:
    // connectedCallback awaits the client and then overwrites whatever was
    // assigned, so every container ends up on whichever client resolved first.
    this._workflowAssigned = workflow !== undefined;
    this._setWorkflow(workflow);
  }

  get logo() {
    return logoAttrToProp(this.getAttribute(ATTR_LOGO));
  }

  set logo(value) {
    if (this.logo === value) {
      return;
    }
    const attrValue = logoPropToAttr(value);
    if (attrValue) {
      this.setAttribute(ATTR_LOGO, attrValue);
    } else {
      this.removeAttribute(ATTR_LOGO);
    }
  }

  // lifecycle //
  async connectedCallback() {
    super.connectedCallback();
    const client = this._client = await getClient(MisoContainerElement);
    if (document.body.contains(this)) { // in case already disconnected
      if (!this._workflowAssigned) {
        this._setWorkflow(this._getWorkflow(client));
      }
      this._onConnected(client);
    }
  }

  disconnectedCallback() {
    // Keep the explicit assignment flag: a container that is moved or
    // re-attached should return to the workflow it was given, not the default.
    const assigned = this._workflowAssigned;
    this._setWorkflow(undefined);
    this._workflowAssigned = assigned;
    super.disconnectedCallback();
  }

  _onConnected(client) {}

  _getWorkflow(client) {
    throw new Error('Unimplemented');
  }

  _setWorkflow(workflow) {
    if (this._workflow === workflow) {
      return;
    }
    if (this._workflow) {
      this._workflow._views.removeContainer(this);
    }
    if (workflow) {
      workflow._views.addContainer(this);
    }
    this._workflow = workflow;
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_LOGO:
        this._handleLogoUpdate(oldValue, newValue);
        break;
      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }

  _handleLogoUpdate(oldAttrValue, newAttrValue) {
    const oldPropValue = logoAttrToProp(oldAttrValue);
    const newPropValue = logoAttrToProp(newAttrValue);
    if (oldPropValue === newPropValue || !this._workflow) {
      return;
    }
    this._workflow._views.refreshElement(this);
  }

  // components //
  get components() {
    return [...this._components];
  }

  _addComponent(element) {
    if (this._components.has(element)) {
      return;
    }
    this._components.add(element);
    this._workflow && this._workflow._views.addComponent(element);
  }

  _removeComponent(element) {
    if (!this._components.has(element)) {
      return;
    }
    this._workflow && this._workflow._views.removeComponent(element);
    this._components.delete(element);
  }

  _updateComponentRole(element, oldRole, newRole) {
    this._workflow && this._workflow._views.updateComponentRole(element, oldRole, newRole);
  }

}
