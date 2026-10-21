import MisoContainerElement from './miso-container.js';

const TAG_NAME = 'miso-conversation';

/**
 * The container of the Conversation workflow: the open thread of the chat history interface.
 */
export default class MisoConversationElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoContainerElement.observedAttributes;
  }

  _getWorkflow(client) {
    return client.workflows.conversation;
  }

}
