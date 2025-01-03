import { mixin } from '@miso.ai/commons';
import { fields } from '../actor/index.js';
import Autocomplete from './autocomplete.js';

export function makeAutocompletable(prototype) {
  mixin(prototype, AutocompletableMixin.prototype);
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
