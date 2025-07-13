import MisoContextElement from './miso-context.js';

const TAG_NAME = 'miso-follow-ups';

export default class MisoFollowUpsElement extends MisoContextElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoContextElement.observedAttributes;
  }

  constructor() {
    super();
    this._elementToWorkflow = new WeakMap();
    this._unsubscribes = [];
  }

  _getContext(client) {
    return client.ui.asks;
  }

  _onContext(context, oldContext) {
    if (context === oldContext) {
      return;
    }
    this._unwire();
    this._wire(context);
  }

  _unwire() {
    for (const unsubscribe of this._unsubscribes || []) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

  _wire(context) {
    if (!context) {
      return;
    }

    // 1. call auto-next if unset
    if (!context._autoNextFn) {
      context.autoNext();
    }

    // 2. when a new workflow is created, insert a new section
    this._unsubscribes.push(context.on('create', (workflow) => {
      const { parentQuestionId } = workflow;
      const template = workflow._options.resolved.templates.followUp;
      if (!parentQuestionId || !template) {
        return;
      }
      const oldChildCount = this.children.length;
      this.insertAdjacentHTML('beforeend', template({ parentQuestionId }));
      const newChildCount = this.children.length;
      // keep track of the elements
      for (const element of Array.prototype.slice.call(this.children, oldChildCount, newChildCount)) {
        this._elementToWorkflow.set(element, workflow);
      }
    }));

    // 3. when a workflow is destroyed, remove the section
    this._unsubscribes.push(context.on('destroy', ({ workflow }) => {
      for (const element of this.children) {
        if (this._elementToWorkflow.get(element) === workflow) {
          this._elementToWorkflow.delete(element);
          element.remove();
        }
      }
    }));
  }

}
