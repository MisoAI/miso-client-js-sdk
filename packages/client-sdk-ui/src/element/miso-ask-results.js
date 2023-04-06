import { getClient } from './utils';

const TAG_NAME = 'miso-ask-results';

export default class MisoAskResultsElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  // lifecycle //
  async connectedCallback() {
    // find client & auto bind
    const client = await getClient();
    //client.ui.search.bind(this.constructor.role, this);
  }

}
