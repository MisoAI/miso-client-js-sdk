import { onChildElement, parseDataFromElement, parseTemplateFromElement, isStandardScriptType } from './util';
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
    try {
      this._setFromAttributeOrChild(attr, newValue);
    } catch(e) {
      this._error(e);
    }
  }

  _processChild(child) {
    try {
      const tagName = child.tagName.toLowerCase();
      switch (tagName) {
        case 'script':
          if (!isStandardScriptType(child.getAttribute('type'))) {
            this._processScriptChild(child);
          }
          break;
        case 'template':
          if (child.dataset.name) {
            this._processTemplateChild(child);
          }
          break;
      }
    } catch(e) {
      this._error(e);
    }
  }

  _processScriptChild(child) {
    const attr = child.dataset.attr;
    /*
    const name = child.dataset.name;
    if (!name && (attr === 'template' || attr === 'on')) {
      throw new Error(`Script element with data-attr="template" requires data-name attribute.`);
    }
    */
    let value;
    try {
      value = parseDataFromElement(child);
    } catch (e) {
      throw new Error(`Error parsing script element content ${attr}.`, { cause : e });
    }
    this._setFromAttributeOrChild(attr, value);
  }

  _processTemplateChild(child) {
    const name = child.dataset.name;
    let value;
    try {
      value = parseTemplateFromElement(child);
    } catch (e) {
      throw new Error(`Error parsing template element content of template "${name}".`, { cause : e });
    }
    this.templates.set(name, value);
  }

  _setFromAttributeOrChild(attr, value) {
    const segments = attr.split(':');
    attr = segments[0];
    const name = segments[1];
    switch (attr) {
      /*
      case 'template':
        if (name) {
          this.templates.set(name, value);
        }
        break;
      */
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
    this._trigger('start');
  }

  _trigger(condition) {
    const command = this._triggers[condition];
    if (command) {
      this._commend(command);
    }
    this._emit('trigger', command ? { condition, command } : { condition });
  }

  _commend(command) {}

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
    root().elements.elementRoot._events.emit(name, { ...detail, instance: this });
  }

  _error(e) {
    root().elements.elementRoot._error(e);
  }

}
