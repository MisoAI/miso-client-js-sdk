import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-hybrid-search';

export default class MisoHybridSearchElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoContainerElement.observedAttributes;
  }

  _getWorkflow(client) {
    return client.ui.hybridSearch;
  }

}
