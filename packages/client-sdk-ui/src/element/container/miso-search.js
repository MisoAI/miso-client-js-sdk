import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-search';

/**
 * The container of the Search workflow.
 */
class MisoSearchElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoContainerElement.observedAttributes;
  }

  _getWorkflow(client) {
    return client.workflows.search;
  }

}

export default MisoSearchElement;
