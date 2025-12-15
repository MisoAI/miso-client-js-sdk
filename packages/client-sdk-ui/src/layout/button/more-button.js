import { STATUS } from '../../constants.js';
import { fields } from '../../actor/index.js';
import TemplateBasedLayout from '../template.js';
import { helpers } from '../templates.js';

const TYPE = 'more-button';
const DEFAULT_CLASSNAME = 'miso-more-button';

function root(layout, state) {
  const { className, role, templates } = layout;
  const roleAttr = role ? ` data-role="${role}"` : '';
  const disabledAttr = state.status !== STATUS.READY ? ' disabled' : '';
  return `
<div class="${className}"${roleAttr}${disabledAttr}>
  ${helpers.asFunction(templates.text)(layout)}
</div>
`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  text,
});

function text(layout) {
  return 'More';
}

export default class MoreButtonLayout extends TemplateBasedLayout {

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
      view.proxyElement.on('click', (e) => this._handleClick(e)),
    ];
  }

  _handleClick(event) {
    // only left click
    if (event.button !== 0) {
      return;
    }
    const button = event.target.closest('[data-role="more"]');
    if (!button || button.disabled) {
      return;
    }
    this._view.hub.trigger(fields.more());
  }

}
