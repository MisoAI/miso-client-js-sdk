/** @module workflow */

import { mixin } from '@miso.ai/commons';
import { fields } from '../actor/index.js';
import Autocomplete from './autocomplete.js';

export function makeAutocompletable(prototype) {
  mixin(prototype, AutocompletableMixin.prototype);
}

export function makeAutocompletableContext(prototype) {
  mixin(prototype, AutocompletableContextMixin.prototype);
}

export class AutocompletableMixin {

  _initAutocomplete() {
    this._autocomplete = new Autocomplete(this, { defaults: this._defaults.autocomplete });
  }

  /**
   * The autocomplete workflow, which suggests completions as the user types
   * in the search box.
   *
   * @type {Autocomplete}
   */
  get autocomplete() {
    return this._autocomplete;
  }

  /**
   * Show completions in the search box, provided by your own code.
   *
   * @param {Object} data - The completions data.
   * @returns {this}
   */
  updateCompletions(data) {
    this._hub.update(fields.completions(), data);
    return this;
  }

  _destroyAutocomplete() {
    this._autocomplete && this._autocomplete._destroy();
    this._autocomplete = undefined;
  }

}

export class AutocompletableContextMixin {

  _initAutocompleteContext() {
    this._autocomplete = new AutocompleteContext(this);
  }

  /**
   * Autocomplete settings shared by the workflows of this context. Call
   * `enable()` or `disable()` to switch autocomplete on or off, and read
   * `enabled` for the current state.
   *
   * @type {Object}
   */
  get autocomplete() {
    return this._autocomplete;
  }

}

class AutocompleteContext {

  constructor(context) {
    this._context = context;
    this._active = false;
  }

  // API //
  get enabled() {
    return this._active;
  }

  enable() {
    this._active = true;
  }

  disable() {
    this._active = false;
  }

}
