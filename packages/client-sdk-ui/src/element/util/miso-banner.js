const TAG_NAME = 'miso-banner';

/**
 * Miso's banner.
 */
class MisoBannerElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  // lifecycle //
  async connectedCallback() {
    MisoBannerElement.MisoClient.ui.layouts.create('banner').render(this);
  }

}

export default MisoBannerElement;
