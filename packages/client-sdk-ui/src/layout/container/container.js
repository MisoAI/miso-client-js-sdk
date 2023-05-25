import { ROLE, LAYOUT_CATEGORY } from '../../constants';
import RafLayout from '../raf';
import MisoBannerElement from '../../element/miso-banner';

const TYPE = 'container';

export default class ContainerLayout extends RafLayout {

  static get category() {
    return LAYOUT_CATEGORY.CONTAINER;
  }

  static get type() {
    return TYPE;
  }

  constructor({ logo = 'auto', ...options } = {}) {
    super({
      logo,
      ...options,
    });
  }

  _render(element, { state }) {
    this._renderBanner(element);
    this._syncStatus(element, { state });
  }

  _renderBanner(element) {
    // add banner only if necessary
    const banner = MisoBannerElement.tagName;
    const shallRender = this._shallRenderBanner(element);
    if (shallRender && !element.querySelector(banner)) {
      element.insertAdjacentHTML('beforeend', `<${banner} visible-when="ready"></${banner}>`);
    }
  }

  _shallRenderBanner(element) {
    const { logo } = this.options;
    // logo === 'auto': only add banner when result-typed components are present
    return logo === 'auto' ? element.components.some(({ role }) => role === ROLE.RESULTS || role === ROLE.ANSWER) : !!logo;
  }

  _syncStatus(element, { state }) {
    const { status } = state;
    // TODO: add "ongoing" status
    element && element.setAttribute('status', status);
  }

}
