import { fields } from '../../actor/index.js';
import RadioLayout from './radio.js';
import { THUMB } from '../svgs.js';

const TYPE = 'feedback';
const DEFAULT_CLASSNAME = 'miso-feedback';

const OPTIONS = [ 'helpful', 'unhelpful' ];

function options(layout) {
  const { templates } = layout;
  return OPTIONS.map(value => templates.option(layout, { value })).join('');
}

function content(layout, { value }) {
  const { className, templates, options = {} } = layout;
  return `
${options.icon !== false ? `<i class="${className}__icon">${templates.icon(layout, value)}</i>` : ''}
${options.text !== false ? `<span class="${className}__text">${templates.text(layout, value)}</span>` : ''}
`;
}

function icon(layout, value) {
  switch (value) {
    case 'helpful':
    case 'unhelpful':
      return THUMB;
    default:
      return '';
  }
}

function text(layout, value) {
  switch (value) {
    case 'helpful':
      return 'Helpful';
    case 'unhelpful':
      return 'Not helpful';
    default:
      return '';
  }
}

const DEFAULT_TEMPLATES = Object.freeze({
  options,
  content,
  icon,
  text,
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
