import WorkflowContext from './context.js';
import Message from './message.js';

/**
 * The context managing message workflows — the item subworkflows behind
 * <miso-message> elements in the conversation panel — keyed by question id,
 * in the manner of the ask workflows' context (Asks). Workflows are created
 * by elements (through the conversation workflow's getMessageWorkflow), not
 * by data: the conversation propagates records only into instances that
 * exist.
 *
 * A workflow for a just-posted message has no question id yet: it is keyed
 * by the local placeholder id its record carries, and adopts the question id
 * when the response arrives (Message._writeQuestionId registers it here) —
 * one workflow, one continuous session across the settle.
 */
export default class Messages extends WorkflowContext {

  constructor(plugin, client) {
    super('messages', plugin, client);
    this._byQid = new Map();
    this._byPid = new Map();
  }

  get workflows() {
    return [...new Set([...this._byQid.values(), ...this._byPid.values()])];
  }

  /**
   * The workflow of a message record: by its question id, falling back to
   * the local placeholder id.
   */
  get(message, { autoCreate = false } = {}) {
    const { question_id, placeholder_id } = message || {};
    let workflow = (question_id && this._byQid.get(question_id)) || (placeholder_id && this._byPid.get(placeholder_id)) || undefined;
    if (!workflow && autoCreate && (question_id || placeholder_id)) {
      workflow = new Message(this, question_id);
      if (!message.live) {
        // only a live message delivers its own data (posting the question,
        // ask-style); any other receives its record from the conversation
        // workflow, so the data actor has nothing to do
        workflow.useApi(false);
      }
      question_id && this._byQid.set(question_id, workflow);
      placeholder_id && this._byPid.set(placeholder_id, workflow);
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
    this._byPid.clear();
  }

}
