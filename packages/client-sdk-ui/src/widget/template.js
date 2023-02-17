import { defineValues, requestAnimationFrame as raf } from '@miso.ai/commons';
import { VIEW_STATUS } from '../constants';

const DEFAULT_TEMPLATES = Object.freeze({
  root: (widget, state) => `<div class="${widget.className} ${state.status}">${widget.templates[state.status](widget, state)}</div>`,
  [VIEW_STATUS.INITIAL]: () => ``,
  [VIEW_STATUS.LOADING]: () => ``,
  [VIEW_STATUS.READY]: () => ``,
  [VIEW_STATUS.ERRONEOUS]: () => ``,
});

export default class TemplateBasedWidget {

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor(className, templates) {
    defineValues(this, {
      className,
      templates: {
        ...DEFAULT_TEMPLATES,
        ...templates,
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
