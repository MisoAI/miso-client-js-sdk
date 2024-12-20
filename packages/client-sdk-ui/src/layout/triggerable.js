import { mixin, viewable as whenViewable } from '@miso.ai/commons';
import { STATUS } from '../constants.js';
import { fields } from '../actor/index.js';

export function makeTriggerable(prototype) {
  mixin(prototype, TriggerableMixin.prototype);
}

export class TriggerableMixin {

  _initTriggerable() {
    this._trigger = undefined;
  }

  _syncTrigger(element, state) {
    if (!this.options.infiniteScroll) {
      return;
    }
    const workflowPaginationOptions = this.workflowOptions.pagination;
    if (!workflowPaginationOptions.active || workflowPaginationOptions.mode !== 'infiniteScroll') {
      return;
    }
    // only track trigger when ready
    if (state.status === STATUS.READY) {
      this._trackTrigger(element);
    } else {
      this._untrackTrigger();
    }
  }

  async _trackTrigger(element) {
    if (this._trigger) {
      return;
    }
    const triggerElement = element.querySelector('[data-role="trigger"]');
    if (!triggerElement) {
      return;
    }
    const ac = new AbortController();
    this._trigger = Object.freeze({
      element: triggerElement,
      ac,
    });
    let result = false;
    try {
      await whenViewable(triggerElement, { area: 1, duration: 0, signal: ac.signal });
      result = true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        throw e;
      }
    } finally {
      this._trigger = undefined;
    }
    if (result) {
      this._onTrigger();
    }
  }

  _onTrigger() {
    this._view.hub.trigger(fields.more());
  }

  _untrackTrigger() {
    if (!this._trigger) {
      return;
    }
    this._trigger.ac && this._trigger.ac.abort();
    this._trigger = undefined;
  }

  _destroyTriggerable() {
    this._untrackTrigger();
  }

}
