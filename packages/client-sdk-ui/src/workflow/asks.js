import { WORKFLOW_CONFIGURABLE, STATUS } from '../constants.js';
import WorkflowContext from './context.js';
import Ask from './ask.js';
import { makeConfigurable } from './options/index.js';

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

export default class Asks extends WorkflowContext {

  constructor(plugin, client) {
    super('asks', plugin, client);
    this._byQid = new Map();
    this._byPqid = new Map();
    this._root = new Ask(this); // initialize with default workflow
    this._events.on('*', event => this._createNextIfNecessary(event));
    this._events.on('loading', event => this._setActive(event.workflow));
    this._events.on('destroy', () => this._requestEmitAfterDestroy());
    this._events.on('after-destroy', () => this._syncActiveOnAfterDestroy());
    this._autoNextFn = undefined;
    this._active = this._root;
  }

  get root() {
    return this._root;
  }

  get workflows() {
    return [this._root, ...this._byPqid.values()];
  }

  get active() {
    return this._active;
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
      this._root.restart();
    }
  }

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
