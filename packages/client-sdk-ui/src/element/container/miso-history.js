import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-history';

export default class MisoHistoryElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoContainerElement.observedAttributes;
  }

  _getWorkflow(client) {
    return client.workflows.history;
  }

}
