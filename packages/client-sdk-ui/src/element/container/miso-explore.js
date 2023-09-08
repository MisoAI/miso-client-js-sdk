import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-explore';

export default class MisoExploreElement extends MisoContainerElement {

  static get observedAttributes() {
    return MisoContainerElement.observedAttributes;
  }

  static get tagName() {
    return TAG_NAME;
  }

  _getWorkflow(client) {
    return client.ui.explore;
  }

}
