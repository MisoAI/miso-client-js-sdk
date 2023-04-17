import { defineValues, requestAnimationFrame as raf } from '@miso.ai/commons';
import { requiresImplementation } from './templates';

export default class TemplateBasedLayout {

  constructor({ role, className, templates, ...options } = {}) {
    defineValues(this, {
      role,
      className,
      templates: {
        ...requiresImplementation('root'),
        ...templates,
      },
      options,
    });
    this._unsubscribes = [];
  }

  async render(element, state, { silence }) {
    // TODO: notify update manually
    this._html = this.templates.root(this, state);
    // only render the last update request
    await raf(() => {
      if (this._html) {
        element.innerHTML = this._html;
      }
      this._html = undefined;
    });
  }

  destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
