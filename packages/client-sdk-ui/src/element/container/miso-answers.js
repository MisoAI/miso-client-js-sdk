import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-answers';

export default class MisoAnswersElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  _getWorkflow(client) {
    return client.ui.answers;
  }

}
