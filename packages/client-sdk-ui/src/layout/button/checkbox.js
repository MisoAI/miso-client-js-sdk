import { escapeHtml } from '@miso.ai/commons';
import { LAYOUT_TYPE } from '../../constants.js';
import ButtonLayout from './button.js';
import { getIcon } from '../../asset/svgs.js';

const TYPE = LAYOUT_TYPE.CHECKBOX;
const DEFAULT_CLASSNAME = 'miso-checkbox';

function root(layout, state) {
  const { className, role, templates } = layout;
  const checked = isChecked(state);
  const roleAttr = role ? ` data-role="${role}"` : '';
  const checkedAttr = checked ? ' data-checked' : '';
  return `<button type="button" class="${className}" role="switch" aria-checked="${checked}"${roleAttr}${checkedAttr}>${templates.icon(layout, state)}${templates.text(layout, state)}</button>`;
}

function icon(layout, state) {
  const { icon, checkedIcon = icon } = layout.options;
  const name = isChecked(state) ? checkedIcon : icon;
  return name ? getIcon(name) : '';
}

function text(layout, state) {
  const { className, options: { text, checkedText = text } } = layout;
  const value = isChecked(state) ? checkedText : text;
  return value ? `<span class="${className}__text">${escapeHtml(value)}</span>` : '';
}

// the checked state is the mapped data value, so it renders from data alone
function isChecked({ value } = {}) {
  return value === true;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  icon,
  text,
});

/**
 * A checkbox that looks like a button: an icon and a label, each with an
 * optional checked variant (`icon`/`text` and `checkedIcon`/`checkedText`,
 * the latter falling back to the former). It is a switch — semantically a
 * checkbox (`role="switch"`, `aria-checked`), visually a button — for
 * on/off state a user toggles, such as the answer-updates subscription of
 * the conversation panel (role `subscription`).
 *
 * The checked state comes from the data (the mapped value is the boolean —
 * e.g. role `subscription` maps to `'thread.subscribed'`), so a click emits
 * a `change` view event carrying the requested state (`{ checked }`) and
 * nothing else: the workflow acts on it and the new state arrives back down
 * the data path, like any other rendering.
 */
export default class CheckboxLayout extends ButtonLayout {

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

  _handleClick(event) {
    // only left click
    if (event.button !== 0) {
      return;
    }
    const button = event.target.closest(`button.${this.className}`);
    if (!button || button.disabled) {
      return;
    }
    // what the user toggles is the control's current value
    const checked = this._currentValue() === true;
    const { session } = this._view._state || {};
    this._view._emit('change', { session, checked: !checked, domEvent: event });
  }

}
