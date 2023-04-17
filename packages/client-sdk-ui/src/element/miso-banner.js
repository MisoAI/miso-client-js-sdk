const TAG_NAME = 'miso-banner';

export default class MisoBannerElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  // lifecycle //
  async connectedCallback() {
    window.MisoClient.layouts.create('banner').render(this);
  }

}
