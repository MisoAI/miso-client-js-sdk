import { LAYOUT_CATEGORY } from '../../constants';
import TemplateBasedLayout from '../template';
import LOGO from './logo';

const TYPE = 'banner';
const DEFAULT_CLASSNAME = 'miso-banner';

function root(layout) {
  const { className, templates } = layout;
  return `<div class="${className}"><div class="${className}__logo">${templates.logo(layout)}</div></div>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  logo: () => LOGO,
});

// TODO: give a role and make this customizable

export default class BannerLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.BANNER;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
  }

}
