import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  members: [ROLE.TITLE, ROLE.RENAME, ROLE.DELETE, ROLE.SUBSCRIPTION],
  mappings: {
    // the roles map into the thread record: the title text and the
    // subscription checkbox's checked state. Rename and delete take the
    // whole record: their button layouts derive the dialog text from its
    // title and the disabled state from its thread id's absence (a thread
    // being created is not addressable until resolved)
    [ROLE.TITLE]: 'title',
    [ROLE.RENAME]: data => data.value,
    [ROLE.DELETE]: data => data.value,
    [ROLE.SUBSCRIPTION]: 'subscribed',
  },
});

/**
 * One thread item of the thread list: the item subworkflow behind a
 * <miso-thread-item> element, keyed by its thread id and managed by the ThreadItems
 * context (client.workflows.threadItems).
 *
 * A thread item never delivers data of its own: its data actor is off
 * (useApi(false), applied by the ThreadItems context at creation) and the
 * history workflow propagates its record in through updateData() on every
 * data commit — only when the record actually changed, so an update to one
 * thread re-renders that item's roles alone. Being a workflow of its own
 * gives each item its roles and layouts (title, rename, delete,
 * subscription — the generic text/button/checkbox layouts), so the item
 * presentation decomposes into role elements like the conversation panel's.
 *
 * The item is presentation only: its view events delegate to the
 * superworkflow's id-based operations (history.rename/delete/subscribe),
 * whose requests fire on the history workflow's hub — the facts go out as
 * `thread` hub events on both panels' hubs and come back here down the
 * propagation path.
 */
export default class ThreadItem extends Workflow {

  constructor(context, { threadId, placeholderId, superworkflow } = {}) {
    super({
      name: 'thread-item',
      context,
      roles: ROLES_OPTIONS,
      threadId,
      placeholderId,
      superworkflow,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._threadId = args.threadId;
    this._placeholderId = args.placeholderId;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.on(ROLE.RENAME, 'submit', event => this._onViewRenameSubmit(event)),
      this._views.on(ROLE.DELETE, 'submit', () => this._onViewDeleteSubmit()),
      this._views.on(ROLE.SUBSCRIPTION, 'change', event => this._onViewSubscriptionChange(event)),
    ];
  }

  // properties //
  get threadId() {
    return this._threadId;
  }

  get thread() {
    const data = this._hub.states[fields.data()];
    return data && data.value;
  }

  // a workflow created for a thread being created has no thread id yet: it
  // adopts the id when the placeholder settles, registering at the context so
  // lookups by thread id find it from then on
  _writeThreadId(threadId) {
    if (this._threadId || !threadId) {
      return;
    }
    this._threadId = threadId;
    this._context._byTid.set(threadId, this);
  }

  // view actions //
  // delegated to the superworkflow's id-based operations; a thread being
  // created has no server identity to operate on — the thread id guards
  // (re-guarded there) keep its placeholder from ever addressing the API
  _onViewRenameSubmit({ value }) {
    const { threadId, _superworkflow: history } = this;
    threadId && value && history && history.rename(threadId, value);
  }

  _onViewDeleteSubmit() {
    const { threadId, _superworkflow: history } = this;
    threadId && history && history.delete(threadId);
  }

  _onViewSubscriptionChange({ checked }) {
    const { threadId, _superworkflow: history } = this;
    if (!threadId || !history) {
      return;
    }
    checked ? history.subscribe(threadId) : history.unsubscribe(threadId);
  }

  // destroy //
  _destroy(options) {
    const { _threadId: threadId, _placeholderId: placeholderId } = this;
    threadId && this._context._byTid.delete(threadId);
    placeholderId && this._context._byPlaceholderId.delete(placeholderId);
    super._destroy(options);
  }

}
