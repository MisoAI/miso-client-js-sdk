import { ROLE, LAYOUT_CATEGORY } from '../../constants.js';
import RafLayout from '../raf.js';
import MisoBannerElement from '../../element/miso-banner.js';

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
    const { logo: globalLogo } = this.options;
    const { logo: localLogo } = element;
    const logo = (localLogo !== undefined && localLogo !== 'auto' ? localLogo : globalLogo);
    // logo === 'auto': only add banner when a component of main role (like producs, answer) is present
    return logo === 'auto' ? element.components.some(({ role }) => isMainRole(role)) : !!logo;
  }

  _syncStatus(element, { state }) {
    if (!element) {
      return;
    }
    const { status, meta: { miso_id } = {} } = state;
    // TODO: add "ongoing" status
    element.setAttribute('status', status);
    if (miso_id) {
      element.setAttribute('miso-id', miso_id);
    } else {
      element.removeAttribute('miso-id');
    }
  }

}

function isMainRole(role) {
  return role === ROLE.PRODUCTS || role === ROLE.ANSWER;
}
