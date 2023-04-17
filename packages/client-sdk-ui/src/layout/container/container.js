import { requestAnimationFrame as raf } from '@miso.ai/commons';
import { ROLE, STATUS, LAYOUT_CATEGORY } from '../../constants';
import MisoBannerElement from '../../element/miso-banner';

const TYPE = 'container';

export default class ContainerLayout {

  static get category() {
    return LAYOUT_CATEGORY.CONTAINER;
  }

  static get type() {
    return TYPE;
  }

  constructor({ logo = 'auto' } = {}) {
    this.options = { logo };
  }

  initialize(view) {
    this._view = view;
    // TODO: need an API for this
    const { status = STATUS.INITIAL } = view._views._getData() || {};
    this._status = status;
  }

  async render(_, state) {
    this._status = state.status;
    this._requestRender();
  }

  _requestRender() {
    if (this._requested) {
      return;
    }
    this._requested = true;

    raf(() => {
      if (!this._requested) {
        return;
      }
      this._requested = false;
      this._render();
    });
  }

  _render() {
    const { element } = this._view;
    if (!element) {
      return;
    }
    const { logo } = this.options;
    // add banner if necessary
    const banner = MisoBannerElement.tagName;
    const shallRender = this._shallRenderLogo(element, logo);
    if (shallRender && !element.querySelector(banner)) {
      element.insertAdjacentHTML('beforeend', `<${banner} visible-when="ready"></${banner}>`);
    }
    this._syncStatus();
  }

  _shallRenderLogo(element, logo) {
    // logo === 'auto': only add banner when result-typed components are present
    return logo === 'auto' ? element.components.some(({ role }) => role === ROLE.RESULTS || role === ROLE.ANSWER) : !!logo;
  }

  _syncStatus() {
    const { element } = this._view;
    element && element.setAttribute('status', this._status);
  }

}
