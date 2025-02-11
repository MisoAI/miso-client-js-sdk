import CollectionLayout from './collection.js';
import { makeSwipeable } from '../mixin/swipeable.js';
import { TRIANGLE_EQ } from '../../asset/svgs.js';

const TYPE = 'carousel';
const DEFAULT_CLASSNAME = 'miso-carousel';

const DEFAULT_TEMPLATES = Object.freeze({
  body,
  controls,
  controlContainer,
  control,
  controlIcon,
  indexIndicator,
  indexIndicatorItem: () => ``,
  trigger: () => ``, // no trigger element
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

function body(layout, state, values) {
  const { className, templates } = layout;
  return `<div class="${className}__viewport"><div class="${className}__viewport-inner">${templates.list(layout, state, values)}</div></div>${templates.controls(layout, state, values)}`;
}

function controls(layout, state, values) {
  const { templates } = layout;
  return `${templates.controlContainer(layout, state, 'previous')}${templates.controlContainer(layout, state, 'next')}${templates.indexIndicator(layout, state, values)}`;
}

function controlContainer(layout, state, direction) {
  const { className, templates } = layout;
  return `<div class="${className}__control-container-${direction}">${templates.control(layout, state, direction)}</div>`;
}

function control(layout, state, direction) {
  const { className, templates } = layout;
  return `<div class="${className}__control-${direction}" data-role="${direction}">${templates.controlIcon(layout, state, direction)}</div>`;
}

function controlIcon(layout, state, direction) {
  return TRIANGLE_EQ;
}

function indexIndicator(layout, state, values) {
  const { className, templates } = layout;
  return `<ul class="${className}__index-indicator" data-role="index-indicator">${values.map(value => `<li class="${className}__index-indicator-item">${templates.indexIndicatorItem(layout, state, value)}</li>`).join('')}</ul>`;
}

export default class CarouselLayout extends CollectionLayout {

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({ className, templates: { ...DEFAULT_TEMPLATES, ...templates }, ...options });
    this._initSwipeable();
  }

  _render(element, states, controls) {
    super._render(element, states, controls);
    this._renderSwipeable(element, states, controls);
  }

  _afterRender(element, state) {
    super._afterRender(element, state);
    this._afterRenderSwipeable(element, state);
  }

  _onClick(event) {
    this._onClickSwipeable(event);
    super._onClick(event);
  }

}

makeSwipeable(CarouselLayout.prototype);
