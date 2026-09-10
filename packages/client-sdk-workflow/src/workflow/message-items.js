import WorkflowContext from './context.js';
import MessageItem from './message-item.js';

/**
 * The context managing message workflows — the item subworkflows behind
 * <miso-message-item> elements in the conversation panel — keyed by question id,
 * in the manner of the ask workflows' context (Asks). Workflows are created
 * by elements (through the conversation workflow's _getMessageWorkflow), not
 * by data: the conversation propagates records only into instances that
 * exist.
 *
 * A workflow for a just-posted message has no question id yet: it is keyed
 * by the local placeholder id its record carries, and adopts the question id
 * when the response arrives (MessageItem._writeQuestionId registers it here) —
 * one workflow, one continuous session across the settle.
 */
export default class MessageItems extends WorkflowContext {

  constructor(plugin, client) {
    super('message-items', plugin, client);
    this._byQid = new Map();
    this._byPlaceholderId = new Map();
  }

  get workflows() {
    return [...new Set([...this._byQid.values(), ...this._byPlaceholderId.values()])];
  }

  /**
   * The workflow of a message record: by its question id, falling back to
   * the local placeholder id.
   */
  get(message, { autoCreate = false, superworkflow } = {}) {
    const { question_id, placeholder_id, thread_placeholder_id, parent_question_id } = message || {};
    let workflow = (question_id && this._byQid.get(question_id)) || (placeholder_id && this._byPlaceholderId.get(placeholder_id)) || undefined;
    if (!workflow && autoCreate && (question_id || placeholder_id)) {
      workflow = new MessageItem(this, {
        questionId: question_id,
        placeholderId: placeholder_id,
        threadPlaceholderId: thread_placeholder_id,
        parentQuestionId: parent_question_id,
        superworkflow,
      });
      if (!message.live) {
        // only a live message delivers its own data (posting the question,
        // ask-style); any other receives its record from the conversation
        // workflow, so the data actor has nothing to do
        workflow.useApi(false);
      }
      question_id && this._byQid.set(question_id, workflow);
      placeholder_id && this._byPlaceholderId.set(placeholder_id, workflow);
      this._client._events.emit('postworkflow', workflow);
    }
    return workflow;
  }

  getByQuestionId(questionId, { autoCreate = false } = {}) {
    if (typeof questionId !== 'string') {
      throw new Error(`Required ID to be a string: ${questionId}`);
    }
    return this.get({ question_id: questionId }, { autoCreate });
  }

  reset(options) {
    for (const workflow of this.workflows) {
      workflow.destroy(options);
    }
    this._byQid.clear();
    this._byPlaceholderId.clear();
  }

}
