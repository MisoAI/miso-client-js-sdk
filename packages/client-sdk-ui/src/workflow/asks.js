import WorkflowContext from './context.js';
import Ask from './ask.js';

export default class Asks extends WorkflowContext {

  constructor(plugin, client) {
    super('asks', plugin, client);
    this._byQid = new Map();
    this._byPqid = new Map();
    this._root = new Ask(this); // initialize with default workflow
  }

  get root() {
    return this._root;
  }

  get workflows() {
    return [this._root, ...this._byPqid.values()];
  }

  getByQuestionId(questionId) {
    if (typeof questionId !== 'string') {
      throw new Error(`Required ID to be a string: ${questionId}`);
    }
    return this._byQid.get(questionId);
  }

  getByParentQuestionId(parentQuestionId, { autoCreate = false } = {}) {
    if (parentQuestionId === undefined) {
      return this._root;
    }
    if (typeof parentQuestionId !== 'string') {
      throw new Error(`Required ID to be a string: ${parentQuestionId}`);
    }
    let workflow = this._byPqid.get(parentQuestionId);
    if (!workflow && autoCreate) {
      workflow = new Ask(this, parentQuestionId);
    }
    return workflow;
  }

  reset({ root = true, events, ...options } = {}) {
    // clear event listeners on context
    if (events === undefined) {
      events = !!root; // events are default to be true only when root = true
    }
    if (events) {
      this._events.clear();
    }

    // destroy all follow-up workflows
    for (const workflow of this._byPqid.values()) {
      workflow.destroy(options);
    }

    // reset root workflow
    if (root) {
      this._root.reset();
    }
  }

}
