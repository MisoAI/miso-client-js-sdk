import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-hybrid-search';

export default class MisoHybridSearchElement extends MisoContainerElement {

  static get observedAttributes() {
    return MisoContainerElement.observedAttributes;
  }

  static get tagName() {
    return TAG_NAME;
  }

  _getWorkflow(client) {
    return client.ui.hybridSearch;
  }

}
