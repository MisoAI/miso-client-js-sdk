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

  constructor({ attrToProps }) {
    super();
    this._attrToProps = attrToProps || {};
    this._elements = {};
    this._triggers = {};
    this.templates = new Templates();
    this._doInit = this._doInit.bind(this);
  }

  connectedCallback() {
    onChildElement(this, this._processChild.bind(this));
    setTimeout(this._doInit);
  }

  _doInit() {
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
      case 'on':
        if (name) {
          this._triggers[name] = value;
        }
        break;
      default:
        let prop = this._attrToProps[attr];
        let transform = v => v;
        if (Array.isArray(prop)) {
          [prop, transform] = prop;
        }
        if (typeof transform === 'string') {
          transform = TRAMSFORMS[transform];
        }
        if (prop) {
          this[prop] = transform(value);
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
      this._command(command);
    }
    this._emit('trigger', command ? { condition, command } : { condition });
  }

  _command(command) {}

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
    root().elements.elementRoot._events.emit(name, { ...detail, instance: this });
  }

  _error(e) {
    root().elements.elementRoot._error(e);
  }

}

const TRAMSFORMS = {
  boolean: v => v !== 'false' && v,
  // TODO: number
};
