import { onChild, parseDataFromElement } from './util';
import Template from './template';

export default class MisoElement extends HTMLElement {

  constructor() {
    super();
    this._attrToProps = {};
    this._templates = {};
    this._elements = {};
  }

  connectedCallback() {
    onChild(this, this._processChild.bind(this));
    this._init();
  }

  // TODO: handle DOM detach, etc.
  //disconnectedCallback() {}
  //adoptedCallback() {}

  attributeChangedCallback(name, _, newValue) {
    const prop = this._attrToProps[name];
    if (prop) {
      this[prop] = newValue;
    }
  }

  _processChild(child) {
    const attr = child.dataset.attr;
    if (attr === 'template') {
      const name = child.dataset.name;
      try {
        this._setTemplate(name, parseDataFromElement(child));
      } catch(e) {
        // TODO
      }
      return;
    }
    const prop = attr && this._attrToProps[attr];
    if (prop) {
      try {
        this[prop] = parseDataFromElement(child);
      } catch(e) {
        // TODO
      }
    }
  }

  _setTemplate(name, fn) {
    this._templates[name] = new Template(name, fn.bind(this));
  }

  _init() {}

  template(name) {
    return this._templates[name] || (() => { throw new Error(`Template "${name}" not found.`); })();
  }

}
