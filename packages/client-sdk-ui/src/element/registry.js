import { Registry, Component } from '@miso.ai/commons';

class ElementRoot extends Component {

  constructor(root) {
    super('element', root);
  }

}

export default class ElementRegistry extends Registry {

  constructor(root) {
    super('elements', root, {
      libName: 'custom element',
      keyName: 'tagName',
    });
    this._root = this.meta.parent;
    this.elementRoot = new ElementRoot(root);
  }

  install() {
    // define and upgrade custom elements
    this._defineAndUpgradeAll();
  }

  _defineAndUpgradeAll() {
    for (const elementClass of Object.values(this._libraries)) {
      try {
        this._defineAndUpgrade(elementClass);
      } catch(e) {
        this._root._error(e);
      }
    }
  }

  _defineAndUpgrade(elementClass) {
    const tagName = elementClass.tagName;
    customElements.define(tagName, elementClass);
    for (const element of document.querySelectorAll(tagName)) {
      customElements.upgrade(element);
    }
  }

}
