import { EVENT_TYPE } from '../constants.js';
import Bindings from '../util/bindings.js';
import Viewables from '../util/viewables.js';
import { validateClick } from '../util/trackers.js';

export function makeTrackable(prototype) {
  _mixin(prototype, TrackableMixin.prototype);
}

function _mixin(target, source) {
  const descriptors = Object.getOwnPropertyDescriptors(source);
  for (const key in descriptors) {
    if (key === 'constructor') {
      continue;
    }
    const { value } = descriptors[key];
    if (target[key] === undefined && typeof value === 'function') {
      target[key] = value;
    }
    // TODO: getter, setter
  }
}

export class TrackableMixin {

  _initTrackable() {
    this._bindings = new Bindings();
    this._viewables = new Viewables();
  }

  _syncBindings(element, state) {
    const values = this._getItems(state) || [];
    const keys = values.map(value => this._getItemKey(value));
    const elements = this._getItemElements(element);

    const { bounds, unbounds } = this._bindings.update(keys, values, elements);
    this._onBindingsUpdate(bounds, unbounds);
  }

  _clearBindings() {
    const { bounds, unbounds } = this._bindings.clear();
    this._onBindingsUpdate(bounds, unbounds);
  }

  _getItemKey(value) {
    // TODO: ad-hoc!
    return value.product_id || value.text || value.id || value;
  }

  _getItems(state) {
    throw new Error(`Not implemented.`);
  }

  _getItemElements(element) {
    throw new Error(`Not implemented.`);
  }

  _onBindingsUpdate(bounds, unbounds) {
    this._trackImpressions(bounds);
    this._untrackViewables(unbounds);
    this._trackViewables(bounds);
  }

  _trackImpressions(entries) {
    if (entries.length === 0) {
      return;
    }
    const { impression: options } = this._view.trackerOptions || {};
    if (!options) {
      return;
    }
    setTimeout(() => this._view._track(EVENT_TYPE.IMPRESSION, entries.map(({ value }) => value)), 0);
  }

  _untrackViewables(entries) {
    for (const { element } of entries) {
      this._viewables.untrack(element);
    }
  }

  _trackViewables(entries) {
    if (entries.length === 0) {
      return;
    }
    const { viewable: options } = this._view.trackerOptions || {};
    if (!options) {
      return;
    }
    for (const { value, element } of entries) {
      (async () => (await this._viewables.track(element, options)) && this._view._track(EVENT_TYPE.VIEWABLE, [value]))();
    }
  }

  _trackClick(event, binding) {
    const { click: options } = this._view.trackerOptions || {};
    if (validateClick(options, event, binding)) {
      this._view._track(EVENT_TYPE.CLICK, [binding.value]);
    }
  }

  _destroyTrackable() {
    const { unbounds } = this._bindings.clear();
    this._untrackViewables(unbounds);
  }

}
