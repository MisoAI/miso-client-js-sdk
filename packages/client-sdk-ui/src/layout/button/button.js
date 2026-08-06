import { escapeHtml } from '@miso.ai/commons';
import { LAYOUT_TYPE } from '../../constants.js';
import TemplateBasedLayout from '../template.js';
import { getIcon } from '../../asset/svgs.js';

const TYPE = LAYOUT_TYPE.BUTTON;
const DEFAULT_CLASSNAME = 'miso-button';

function root(layout, state) {
  const { className, role, templates } = layout;
  const roleAttr = role ? ` data-role="${role}"` : '';
  return `<button type="button" class="${className}"${roleAttr}>${templates.icon(layout, state)}${templates.text(layout, state)}</button>`;
}

function icon(layout) {
  const { icon } = layout.options;
  return icon ? getIcon(icon) : '';
}

function text(layout) {
  const { className, options: { text } } = layout;
  return text ? `<span class="${className}__text">${escapeHtml(text)}</span>` : '';
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  icon,
  text,
});

/**
 * A generic button: an icon and a label, both configurable (`icon` is an icon
 * name, `text` the label; either can be omitted), emitting a `submit` view
 * event when clicked — for the workflow to act on, per role.
 *
 * It carries no data of its own, so it renders in any state; use it for
 * actions that stand apart from the data they act on, such as the new chat
 * button (role `new_thread`) of the chat history interface.
 */
export default class ButtonLayout extends TemplateBasedLayout {

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
  }

  initialize(view) {
    this._unsubscribes = [
      ...this._unsubscribes,
      view.proxyElement.on('click', event => this._handleClick(event)),
    ];
  }

  _handleClick(event) {
    // only left click
    if (event.button !== 0) {
      return;
    }
    const button = event.target.closest(`button.${this.className}`);
    if (!button || button.disabled) {
      return;
    }
    const { session } = this._view._state || {};
    this._view._emit('submit', { session, domEvent: event });
  }

}
