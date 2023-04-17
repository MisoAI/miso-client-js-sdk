import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-ask';

export default class MisoAskElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  _getWorkflow(client) {
    return client.ui.ask;
  }

}
