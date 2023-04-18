import { fields } from '../../actor';
import RadioLayout from './radio';
import { THUMB } from '../svgs';

const TYPE = 'feedback';
const DEFAULT_CLASSNAME = 'miso-feedback';

function root(layout) {
  const { className, role, templates, options } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `
<div class="${className}" ${roleAttr}>
  ${options.options.map((option) => templates.option(layout, option))}
</div>
`;
}

const OPTIONS = [
  {
    text: 'Helpful',
    value: 'helpful',
    icon: THUMB,
  },
  {
    text: 'Not helpful',
    value: 'unhelpful',
    icon: THUMB,
  },
];

function options(layout) {
  const { templates } = layout;
  return OPTIONS.map((data) => templates.option(layout, data)).join('');
}

function content(layout, { text, icon }) {
  const { className, options = {} } = layout;
  return `
${options.icon !== false ? `<i class="${className}__icon">${icon}</i>` : ''}
${options.text !== false ? `<span class="${className}__text">${text}</span>` : ''}
`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  options,
  content,
});

export default class FeedbackLayout extends RadioLayout {

  static get category() {
    return super.category;
  }

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
      field: fields.feedback(),
      ...options,
    });
    if (options.text === false && options.icon === false) {
      throw new Error('At least one of options.text or options.icon must be enabled');
    }
  }

}
