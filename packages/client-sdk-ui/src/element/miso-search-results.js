import { ROLE } from '../constants';
import { getMisoClient } from './utils';

const TAG_NAME = 'miso-search-results';

export default class MisoSearchResultsElement extends HTMLElement {

  static get role() {
    return ROLE.RESULTS;
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
  async connectedCallback() {
    // find client & auto bind
    const MisoClient = await getMisoClient();
    const client = this._client = await MisoClient.any();
    client.ui.search.bind(this.constructor.role, this);
  }

}
