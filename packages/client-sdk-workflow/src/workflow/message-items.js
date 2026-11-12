/** @module workflow */

import WorkflowContext from './context.js';
import MessageItem from './message-item.js';

// The context managing message workflows — the item subworkflows behind
// <miso-message-item> elements in the conversation panel — keyed by question id,
// in the manner of the ask workflows' context (Asks). Workflows are created
// by elements (through the conversation workflow's _getMessageWorkflow), not
// by data: the conversation propagates records only into instances that
// exist.
//
// A workflow for a just-posted message has no question id yet: it is keyed
// by the local placeholder id its record carries, and adopts the question id
// when the response arrives (MessageItem._writeQuestionId registers it here) —
// one workflow, one continuous session across the settle.

/**
 * The message item workflow context, available as
 * `client.workflows.messageItems`. Each message of the conversation panel, a `<miso-message-item>` element,
 * is backed by a {@link module:workflow~MessageItem MessageItem} workflow.
 *
 * @extends module:workflow~WorkflowContext
 */
class MessageItems extends WorkflowContext {

  constructor(plugin, client) {
    super('message-items', plugin, client);
    this._byQid = new Map();
    this._byPlaceholderId = new Map();
  }

  /**
   * All message item workflows.
   *
   * @type {MessageItem[]}
   */
  get workflows() {
    return [...new Set([...this._byQid.values(), ...this._byPlaceholderId.values()])];
  }

  /**
   * Get the workflow of a message.
   *
   * @param {Object} message - The message record.
   * @param {Object} [options]
   * @param {boolean} [options.autoCreate=false] - Create the workflow if it does not exist.
   * @returns {MessageItem|undefined}
   */
  get(message, { autoCreate = false, superworkflow } = {}) {
    // by question id, falling back to the local placeholder id
    const { question_id, placeholder_id, thread_placeholder_id, parent_question_id } = message || {};
    let workflow = (question_id && this._byQid.get(question_id)) || (placeholder_id && this._byPlaceholderId.get(placeholder_id)) || undefined;
    if (!workflow && autoCreate && (question_id || placeholder_id)) {
      workflow = new MessageItem(this, {
        questionId: question_id,
        placeholderId: placeholder_id,
        threadPlaceholderId: thread_placeholder_id,
        parentQuestionId: parent_question_id,
        superworkflow,
        // only a live message delivers its own data; liveness is settled at
        // creation — an instance property, since the item shares its
        // options object with the conversation workflow
        live: !!message.live,
      });
      question_id && this._byQid.set(question_id, workflow);
      placeholder_id && this._byPlaceholderId.set(placeholder_id, workflow);
      this._client._events.emit('postworkflow', workflow);
    }
    return workflow;
  }

  /**
   * Get the workflow of a message by its question ID.
   *
   * @param {string} questionId - The question ID.
   * @param {Object} [options]
   * @param {boolean} [options.autoCreate=false] - Create the workflow if it does not exist.
   * @returns {MessageItem|undefined}
   */
  getByQuestionId(questionId, { autoCreate = false } = {}) {
    if (typeof questionId !== 'string') {
      throw new Error(`Required ID to be a string: ${questionId}`);
    }
    return this.get({ question_id: questionId }, { autoCreate });
  }

  /**
   * Destroy all message item workflows.
   */
  reset(options) {
    for (const workflow of this.workflows) {
      workflow.destroy(options);
    }
    this._byQid.clear();
    this._byPlaceholderId.clear();
  }

}

export default MessageItems;
