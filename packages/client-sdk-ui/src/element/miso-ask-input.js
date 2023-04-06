import MisoInputElement from './miso-input';

const TAG_NAME = 'miso-ask-input';

export default class MisoAskInputElement extends MisoInputElement {

  static get role() {
    return MisoInputElement.role;
  }

  static get tagName() {
    return TAG_NAME;
  }

  _query(client, { value }) {
    client.ui.ask.query({ q: value });
  }

}
