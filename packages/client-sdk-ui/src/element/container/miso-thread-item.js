import MisoContainerElement from './miso-container.js';
import { getContainer } from '../utils.js';

const TAG_NAME = 'miso-thread-item';

const ATTR_THREAD_ID = 'thread-id';
const OBSERVED_ATTRIBUTES = Object.freeze([
  ...MisoContainerElement.observedAttributes,
  ATTR_THREAD_ID,
]);

/**
 * A container element for one thread item of the thread list, placed inside
 * <miso-history> — a container element inside another container element
 * hosting an item subworkflow (the `thread` workflow). Normally bound
 * implicitly: the threads layout renders one <miso-thread-item> per item and
 * assigns the workflow off the item binding (element.workflow = parent
 * workflow's getThreadWorkflow(record)), which also covers a thread being
 * created that has no thread id yet. A `thread-id` attribute binds
 * explicitly instead, through the parent container's workflow. Role
 * elements inside (title, rename, delete, subscription) bind to the thread
 * workflow as usual — getContainer() resolves to the closest container
 * ancestor.
 */
export default class MisoThreadItemElement extends MisoContainerElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  // properties //
  get threadId() {
    return this.getAttribute(ATTR_THREAD_ID) || undefined;
  }

  set threadId(value) {
    value = value !== undefined ? `${value}` : undefined;
    if (value === this.threadId) {
      return;
    }
    if (value) {
      this.setAttribute(ATTR_THREAD_ID, value);
    } else {
      this.removeAttribute(ATTR_THREAD_ID);
    }
  }

  _getWorkflow(client) {
    const { threadId } = this;
    if (!threadId) {
      // implicitly bound: the threads layout assigns element.workflow off
      // the item binding — keep whatever is (or will be) assigned
      return this._workflow;
    }
    const container = this._getParentContainer();
    const workflow = container && container.workflow;
    // the parent workflow hands out the item subworkflow; the parent binds
    // its own workflow first (its connectedCallback resolves earlier), so
    // it is normally present by now
    return workflow && typeof workflow.getThreadWorkflow === 'function' ? workflow.getThreadWorkflow(threadId) : undefined;
  }

  _getParentContainer() {
    try {
      return this.parentNode ? getContainer(this.parentNode) : undefined;
    } catch (_) {
      return undefined; // not inside a container element
    }
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    switch (attr) {
      case ATTR_THREAD_ID:
        this._handleThreadIdUpdate(oldValue, newValue);
        break;
      default:
        super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }

  _handleThreadIdUpdate(oldValue, newValue) {
    oldValue = oldValue || undefined; // null -> undefined
    newValue = newValue || undefined;
    if (oldValue === newValue || !this._client) {
      return;
    }
    this._setWorkflow(this._getWorkflow(this._client));
  }

}
