import { getClient } from './utils';
import { ROLE } from '../constants';
import { SearchBoxLayout } from '../layout';

export default class MisoInputElement extends HTMLElement {

  static get role() {
    return ROLE.INPUT;
  }

  // lifecycle //
  connectedCallback() {
    this._setupElements();
    //this._bindClient();
  }

  async _setupElements() {
    if (this.childElementCount === 0) {
      const layout = new SearchBoxLayout();
      await layout.render(this);
    }
    // find elements
    const input = this.querySelector('input');
    const button = this.querySelector('button[type="submit"]') || this.querySelector('button');
    this._elements = {
      input,
      button,
    };
    // bind events
    input && input.addEventListener('keydown', (e) => (e.key === 'Enter') && this._submit());
    button && button.addEventListener('click', () => this._submit());
  }

  /*
  async _bindClient() {
    this._clientPromise = getClient();
  }

  async _client() {
    return this._clientPromise;
  }
  */

  async _submit() {
    const { input } = this._elements;
    if (!input) {
      return;
    }
    const { value } = input;
    if (!value) {
      return;
    }
    // TODO: in case no client is created, we need to log warning?
    const client = await getClient();
    this._query(client, { value });
  }

}
