import MisoStubElement from '../util/miso-stub.js';
import { getClient } from '../utils.js';

export default class MisoContextElement extends MisoStubElement {

  static get observedAttributes() {
    return MisoStubElement.observedAttributes;
  }

  constructor() {
    super();
    this._context = undefined;
  }

  // properties //
  get context() {
    return this._context;
  }

  set context(context) {
    this._setContext(context);
  }

  // lifecycle //
  async connectedCallback() {
    super.connectedCallback();
    const client = this._client = await getClient(MisoContextElement);
    if (document.body.contains(this)) { // in case already disconnected
      this._setContext(this._getContext(client));
    }
  }

  disconnectedCallback() {
    this._setContext(undefined);
    super.disconnectedCallback();
  }

  _getContext(client) {
    throw new Error('Unimplemented');
  }

  _setContext(context) {
    if (this._context === context) {
      return;
    }
    const oldContext = this._context;
    this._context = context;
    this._onContext(context, oldContext);
  }

  _onContext() {}

}
