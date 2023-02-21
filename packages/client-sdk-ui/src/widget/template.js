import { defineValues, requestAnimationFrame as raf } from '@miso.ai/commons';
import { VIEW_STATUS } from '../constants';
import LOGO from './logo';

function root(widget, state) {
  const { className, templates } = widget;
  const { status } = state;
  return `<div class="miso ${className} ${status}">${templates[status](widget, state)}${templates.banner(widget, state)}</div>`;
}

function banner(widget, state) {
  const { options = {} } = widget;
  const { logo } = options;
  return logo ? `<div class="miso__banner"><div class="miso__logo">${LOGO}</div></div>` : '';
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  banner,
  [VIEW_STATUS.INITIAL]: () => ``,
  [VIEW_STATUS.LOADING]: () => ``,
  [VIEW_STATUS.READY]: () => ``,
  [VIEW_STATUS.ERRONEOUS]: () => ``,
});

export default class TemplateBasedWidget {

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor(className, templates, { logo = true } = {}) {
    defineValues(this, {
      className,
      templates: {
        ...DEFAULT_TEMPLATES,
        ...templates,
      },
      options: {
        logo,
      },
    });
  }

  async render(element, state) {
    const html = this.templates.root(this, state);
    this._html = html;
    // only render the last update request
    await raf(() => {
      if (this._html) {
        element.innerHTML = html;
      }
      this._html = undefined;
    });
  }

}
