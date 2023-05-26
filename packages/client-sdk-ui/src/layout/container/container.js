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

  constructor(options = {}) {
    super(options);
  }

  _render(element, { state }) {
    this._syncBanner(element);
    this._syncStatus(element, { state });
  }

  _syncBanner(element) {
    const bannerTagName = MisoBannerElement.tagName;
    const shallRender = this._shallRenderBanner(element);
    const bannerElement = element.querySelector(bannerTagName);
    if (shallRender && !bannerElement) {
      element.insertAdjacentHTML('beforeend', `<${bannerTagName} visible-when="ready"></${bannerTagName}>`);
    } else if (!shallRender && bannerElement) {
      bannerElement.remove();
    }
  }

  _shallRenderBanner(element) {
    const { logo } = element;
    // logo === 'auto': only add banner when result-typed components are present
    return logo === 'auto' ? element.components.some(({ role }) => role === ROLE.RESULTS || role === ROLE.ANSWER) : !!logo;
  }

  _syncStatus(element, { state }) {
    const { status } = state;
    // TODO: add "ongoing" status
    element && element.setAttribute('status', status);
  }

}
