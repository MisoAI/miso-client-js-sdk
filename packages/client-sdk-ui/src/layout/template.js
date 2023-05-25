import { defineValues } from '@miso.ai/commons';
import RafLayout from './raf';
import { requiresImplementation } from './templates';

export default class TemplateBasedLayout extends RafLayout {

  constructor({ className, templates, ...options } = {}) {
    super(options);
    defineValues(this, {
      className,
      templates: {
        ...requiresImplementation('root'),
        ...templates,
      },
    });
  }

  _preprocess({ state }) {
    const html = this.templates.root(this, state);
    return { ...state, html };
  }

  _render(element, { state }) {
    element.innerHTML = state.html;
  }

}
