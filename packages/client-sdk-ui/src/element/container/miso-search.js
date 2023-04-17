import MisoContainerElement from './miso-container';

const TAG_NAME = 'miso-search';

export default class MisoSearchElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  _getWorkflow(client) {
    return client.ui.search;
  }

}
