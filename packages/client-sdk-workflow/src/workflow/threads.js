import WorkflowContext from './context.js';
import Thread from './thread.js';

/**
 * The context managing thread workflows — the item subworkflows behind
 * <miso-thread> elements in the thread list — keyed by thread id, in the
 * manner of the message workflows' context (Messages). Workflows are created
 * by elements (through the history workflow's getThreadWorkflow), not by
 * data: the history workflow propagates records only into instances that
 * exist.
 *
 * A workflow for a thread being created has no thread id yet: it is keyed by
 * the local placeholder id its record carries, and adopts the thread id when
 * the placeholder settles (_resolvePlaceholder, announced by the history
 * workflow) — one workflow, one continuous element binding across the
 * settle.
 */
export default class Threads extends WorkflowContext {

  constructor(plugin, client, model) {
    super('threads', plugin, client);
    this._model = model;
    this._byTid = new Map();
    this._byPlaceholderId = new Map();
  }

  get workflows() {
    return [...new Set([...this._byTid.values(), ...this._byPlaceholderId.values()])];
  }

  /**
   * The workflow of a thread record: by its thread id, falling back to the
   * local placeholder id.
   */
  get(thread, { autoCreate = false, superworkflow } = {}) {
    const { thread_id, placeholder_id } = thread || {};
    let workflow = (thread_id && this._byTid.get(thread_id)) || (placeholder_id && this._byPlaceholderId.get(placeholder_id)) || undefined;
    if (!workflow && autoCreate && (thread_id || placeholder_id)) {
      workflow = new Thread(this, { threadId: thread_id, placeholderId: placeholder_id, superworkflow });
      // a thread item never delivers data of its own: the history workflow
      // propagates its record in, so the data actor has nothing to do
      workflow.useApi(false);
      thread_id && this._byTid.set(thread_id, workflow);
      placeholder_id && this._byPlaceholderId.set(placeholder_id, workflow);
      this._client._events.emit('postworkflow', workflow);
    }
    return workflow;
  }

  getByThreadId(threadId, { autoCreate = false } = {}) {
    if (typeof threadId !== 'string') {
      throw new Error(`Required ID to be a string: ${threadId}`);
    }
    return this.get({ thread_id: threadId }, { autoCreate });
  }

  // the settled record no longer carries the placeholder id, so the workflow
  // adopts the thread id here, keeping the element binding continuous
  _resolvePlaceholder(placeholderId, threadId) {
    const workflow = this._byPlaceholderId.get(placeholderId);
    workflow && workflow._writeThreadId(threadId);
  }

  reset(options) {
    for (const workflow of this.workflows) {
      workflow.destroy(options);
    }
    this._byTid.clear();
    this._byPlaceholderId.clear();
  }

}
