import { defineValues, requestAnimationFrame as raf } from '@miso.ai/commons';
import { requiresImplementation } from './templates';
import LOGO from './logo';

function banner(layout) {
  const { options = {} } = layout;
  const { logo } = options;
  return logo ? `<div class="miso__banner"><div class="miso__logo">${LOGO}</div></div>` : '';
}

const DEFAULT_TEMPLATES = Object.freeze({
  ...requiresImplementation('root'),
  banner,
});

export default class TemplateBasedLayout {

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor(className, templates, { role, logo = true, ...options } = {}) {
    defineValues(this, {
      className,
      role,
      templates: {
        ...DEFAULT_TEMPLATES,
        ...templates,
      },
      options: {
        ...options,
        logo,
      },
    });
  }

  async render(element, state) {
    this._html = this.templates.root(this, state);
    // only render the last update request
    await raf(() => {
      if (this._html) {
        element.innerHTML = this._html;
      }
      this._html = undefined;
    });
  }

}
