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
    this._elements = {
      input,
    };
    // bind events
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this._onEnter();
      }
    });
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

  async _onEnter() {
    const { value } = this._elements.input;
    const client = await this._client();
    client.ui.search.query({ q: value });
  }

}
