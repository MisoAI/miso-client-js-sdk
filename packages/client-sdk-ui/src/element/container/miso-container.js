import { getClient } from '../utils';

export default class MisoContainerElement extends HTMLElement {

  constructor() {
    super();
    this._workflow = undefined;
    this._components = new Set();
  }

  get isContainer() {
    return true;
  }

  get workflow() {
    return this._workflow;
  }

  // lifecycle //
  async connectedCallback() {
    const client = this._client = await getClient();
    if (document.body.contains(this)) { // in case already disconnected
      this._setWorkflow(this._getWorkflow(client));
    }
  }

  disconnectedCallback() {
    this._setWorkflow(undefined);
  }

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
