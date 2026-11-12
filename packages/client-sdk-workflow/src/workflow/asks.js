/** @module workflow */

import { WORKFLOW_CONFIGURABLE, STATUS } from '../constants.js';
import WorkflowContext from './context.js';
import Ask from './ask.js';
import { makeConfigurable } from './options/index.js';
import { makeAutocompletableContext } from './autocompletable.js';

const DEFAULT_AUTO_NEXT_OPTIONS = { event: 'done' };

function autoNextOptionsAsPredicate(options = DEFAULT_AUTO_NEXT_OPTIONS) {
  if (options === true) {
    options = DEFAULT_AUTO_NEXT_OPTIONS;
  }
  if (typeof options === 'string') {
    options = { event: options };
  }
  switch (typeof options) {
    case 'object':
      // TODO: support more options
      return event => event && options.event === event._event;
    case 'function':
      return options;
    default:
      return () => false;
  }
}

/**
 * The Ask workflow context, available as `client.workflows.asks`. Manages
 * the Ask workflows: the one of the first question, plus one for each
 * follow-up question.
 *
 * Events emitted by the Ask workflows are also emitted here, with the
 * source workflow as `event.workflow`.
 *
 * @extends module:workflow~WorkflowContext
 * @mixes module:workflow~TemplatesConfigurable
 */
class Asks extends WorkflowContext {

  constructor(plugin, client) {
    super('asks', plugin, client);
    this._initAutocompleteContext(); // must be earlier than root workflow
    this._byQid = new Map();
    this._byPqid = new Map();
    this._root = new Ask(this); // initialize with default workflow
    client._events.emit('postworkflow', this._root);

    this._events.on('*', event => this._createNextIfNecessary(event));
    this._events.on('loading', event => this._setActive(event.workflow));
    this._events.on('destroy', () => this._requestEmitAfterDestroy());
    this._events.on('after-destroy', () => this._syncActiveOnAfterDestroy());
    this._autoNextFn = undefined;
    this._active = this._root;
  }

  /**
   * The workflow of the first question. Same as `client.workflows.ask`.
   *
   * @type {Ask}
   */
  get root() {
    return this._root;
  }

  /**
   * All Ask workflows.
   *
   * @type {Ask[]}
   */
  get workflows() {
    return [this._root, ...this._byPqid.values()];
  }

  /**
   * The workflow of the latest question being asked or answered.
   *
   * @type {Ask}
   */
  get active() {
    return this._active;
  }

  /**
   * Get a workflow by the question ID of its question.
   *
   * @param {string} questionId - The question ID.
   * @returns {Ask|undefined}
   */
  getByQuestionId(questionId) {
    if (typeof questionId !== 'string') {
      throw new Error(`Required ID to be a string: ${questionId}`);
    }
    return this._byQid.get(questionId);
  }

  /**
   * Get a workflow by the question ID of its parent question. Without a
   * parent question ID, get the workflow of the first question.
   *
   * @param {string} [parentQuestionId] - The question ID of the parent question.
   * @param {Object} [options]
   * @param {boolean} [options.autoCreate=false] - Create the workflow if it does not exist.
   * @returns {Ask|undefined}
   */
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
      this._client._events.emit('postworkflow', workflow);
    }
    return workflow;
  }

  /**
   * Destroy the workflows of all follow-up questions, and start over.
   *
   * @param {Object} [options]
   * @param {boolean} [options.root=true] - Also reset the workflow of the first question.
   * @param {boolean} [options.events] - Also remove the event listeners on this context.
   *   Defaults to the value of `root`.
   */
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
      this._root.restart();
    }
  }

  /**
   * Prepare the workflow of the next follow-up question automatically, so a
   * follow-up question can be asked right away.
   *
   * @param {boolean|string|Function} [options] - When to prepare the next
   *   workflow: `true` (the default) when an answer is done, an event name
   *   to wait for that event, or a function taking the event and returning
   *   whether to prepare.
   */
  autoNext(options) {
    this._autoNextFn = autoNextOptionsAsPredicate(options);
  }

  _createNextIfNecessary(event) {
    if (!this._autoNextFn || !this._autoNextFn(event)) {
      return;
    }
    const { workflow } = event;
    workflow && workflow.getOrCreateNext();
  }

  _requestEmitAfterDestroy() {
    if (this._emitAfterDestroyRequested) {
      return;
    }
    this._emitAfterDestroyRequested = true;
    setTimeout(() => {
      this._emitAfterDestroyRequested = false;
      this._events.emit('after-destroy', {});
    }, 0);
  }

  _syncActiveOnAfterDestroy() {
    if (!this._active.destroyed) {
      return;
    }
    // find last non-initial workflow or root
    let workflow = this._root;
    for (; workflow.next && workflow.next.status !== STATUS.INITIAL; workflow = workflow.next) {}
    this._setActive(workflow);
  }

  _setActive(workflow) {
    if (workflow === this._active) {
      return;
    }
    this._active = workflow;
    this._events.emit('active', { workflow });
  }

}

makeConfigurable(Asks.prototype, [WORKFLOW_CONFIGURABLE.TEMPLATES]);
makeAutocompletableContext(Asks.prototype);

export default Asks;
