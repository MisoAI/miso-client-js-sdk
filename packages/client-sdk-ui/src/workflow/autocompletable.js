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

  _initAutocomplete(args) {
    this._autocomplete = new Autocomplete(this, { defaults: args.defaults.autocomplete });
  }

  get autocomplete() {
    return this._autocomplete;
  }

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
