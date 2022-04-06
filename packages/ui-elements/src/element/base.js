import { onChildElement, parseDataFromElement, isStandardScriptType } from './util';
import root from '../root';

class Templates {

  constructor(context) {
    this._context = context;
    this._templates = {};
  }

  get(name) {
    return this._templates[name] || (() => { throw new Error(`Template "${name}" not found.`); })();
  }

  set(name, fn) {
    this._templates[name] = Object.freeze({ name, render: data => fn.call(this._context, data) });
  }

}

const OBSERVED_ATTRIBUTES = ['on:start', 'on:view'];

export default class MisoElement extends HTMLElement {

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super();
    this._attrToProps = {};
    this._elements = {};
    this._triggers = {};
    this.templates = new Templates();
  }

  connectedCallback() {
    onChildElement(this, this._processChild.bind(this));
    if (!this._initialized) {
      this._initialized = true;
      this._init();
      this._start();
    }
  }

  // TODO: handle DOM detach, etc.
  //disconnectedCallback() {}
  //adoptedCallback() {}

  attributeChangedCallback(attr, _, newValue) {
    const segments = attr.split(':');
    attr = segments[0];
    const name = segments[1];
    try {
      this._setFromAttributeOrChild(attr, name, newValue);
    } catch(e) {
      this._error(e);
    }
  }

  _processChild(child) {
    try {
      if (child.tagName.toLowerCase() !== 'script' || isStandardScriptType(child.getAttribute('type'))) {
        return;
      }
      const attr = child.dataset.attr;
      const name = child.dataset.name;
      if (!name && (attr === 'template' || attr === 'on')) {
        throw new Error(`Script element with data-attr="template" requires data-name attribute.`);
      }
      let value;
      try {
        value = parseDataFromElement(child);
      } catch (e) {
        throw new Error(`Error parsing script element content ${attr}${name ? '-' + name : ''}.`, { cause : e });
      }
      this._setFromAttributeOrChild(attr, name, value);
    } catch(e) {
      this._error(e);
    }
  }

  _setFromAttributeOrChild(attr, name, value) {
    switch (attr) {
      case 'template':
        if (name) {
          this.templates.set(name, value);
        }
        break;
      case 'on':
        if (name) {
          this._triggers[name] = value;
        }
        break;
      default:
        const prop = this._attrToProps[attr];
        if (prop) {
          this[prop] = value;
        }
    }
  }

  _init() {}

  _start() {
    const command = this._triggers.start;
    command && this._cmd(command);
  }

  _cmd(command) {}

  _error(e) {
    root()._error(e);
  }

}
