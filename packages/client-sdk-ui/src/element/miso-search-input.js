import MisoInputElement from './miso-input';

const TAG_NAME = 'miso-search-input';

export default class MisoSearchInputElement extends MisoInputElement {

  static get role() {
    return super.role;
  }

  static get tagName() {
    return TAG_NAME;
  }

  _query(client, { value }) {
    client.ui.search.query({ q: value });
  }

}
