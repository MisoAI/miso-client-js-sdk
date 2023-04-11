import { ROLE } from '../constants';
import { getClient } from './utils';

const TAG_NAME = 'miso-ask-sources';

export default class MisoAskSourcesElement extends HTMLElement {

  static get role() {
    return ROLE.SOURCES;
  }

  static get tagName() {
    return TAG_NAME;
  }

  // lifecycle //
  async connectedCallback() {
    // find client & auto bind
    const client = await getClient();
    client.ui.ask.bind(this.constructor.role, this);
  }

}
