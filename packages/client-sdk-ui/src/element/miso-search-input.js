import { ROLE } from '../constants';
import { getMisoClient } from './utils';
import { SearchBoxLayout } from '../layout';

const TAG_NAME = 'miso-search-input';

export default class MisoSearchInputElement extends HTMLElement {

  static get role() {
    return ROLE.SEARCH_INPUT;
  }

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super();
  }

  // lifecycle //
  connectedCallback() {
    this._setupElements();
    this._bindClient();
  }

  async _setupElements() {
    if (this.childElementCount === 0) {
      const layout = new SearchBoxLayout();
      await layout.render(this); // don't wait
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

  async _bindClient() {
    const MisoClient = await getMisoClient();
    this._clientPromise = await MisoClient.any();
  }

  async _client() {
    return this._clientPromise;
  }

  _generateHtml() {
    return DEFAULT_HTML;
  }

  async _submit() {
    const { input } = this._elements;
    if (!input) {
      return;
    }
    const { value } = input;
    if (!value) {
      return;
    }
    const client = await this._client();
    client.ui.search.query({ q: value });
  }

}
