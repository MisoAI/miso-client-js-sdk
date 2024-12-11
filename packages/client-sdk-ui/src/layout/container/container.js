import { ROLE, STATUS } from '../../constants.js';
import RafLayout from '../raf.js';
import MisoBannerElement from '../../element/miso-banner.js';
import Viewables from '../../util/viewables.js';

const TYPE = 'container';

export default class ContainerLayout extends RafLayout {

  static get type() {
    return TYPE;
  }

  constructor({ logo = 'auto', ...options } = {}) {
    super({
      logo,
      ...options,
    });
    this._impression = false;
    this._viewables = new Viewables();
  }

  _syncElement(element) {
    if (this._element !== element) {
      this._viewables.untrack(this._element);
    }
    super._syncElement(element);
  }

  _render(element, data) {
    this._syncBanner(element);
    this._syncStatus(element, data);
    this._trackInteractions(element, data);
  }

  _afterRender(element, state) {
    this._trackInteractions(element, state);
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
    const { status, ongoing, meta: { miso_id, empty = false } = {} } = state;
    const statuses = [status, empty ? STATUS.EMPTY : STATUS.NONEMPTY];
    if (status === STATUS.READY) {
      statuses.push(ongoing ? STATUS.ONGOING : STATUS.DONE);
    }
    element.setAttribute('status', statuses.join(' '));
    if (miso_id) {
      element.setAttribute('miso-id', miso_id);
    } else {
      element.removeAttribute('miso-id');
    }
  }

  _trackInteractions(element, state) {
    const { status } = state;
    if (status === STATUS.READY) {
      this._trackImpression();
      this._trackViewable(element); // don't await
    }
  }

  _trackImpression() {
    const { impression: options } = this._view.tracker.options || {};
    if (!options) {
      return;
    }
    if (this._impression) {
      return;
    }
    this._impression = true;
    this._view.tracker.impression();
  }

  async _trackViewable(element) {
    const { viewable: options } = this._view.tracker.options || {};
    if (!options) {
      return;
    }
    if (await this._viewables.track(element, options)) {
      this._view.tracker.viewable();
    }
  }

}

function isMainRole(role) {
  return role === ROLE.PRODUCTS || role === ROLE.ANSWER;
}
