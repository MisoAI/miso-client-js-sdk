import * as cheerio from 'cheerio';

class MockClassList {

  constructor(el) {
    this._el = el;
  }

  add(className) {
    this._el.addClass(className);
  }

  remove(className) {
    this._el.removeClass(className);
  }

  toggle(className, force) {
    if (force === undefined) {
      this._el.toggleClass(className);
    } else if (force) {
      this._el.addClass(className);
    } else {
      this._el.removeClass(className);
    }
  }

  contains(className) {
    return this._el.hasClass(className);
  }
}

export default class MockElement {

  constructor() {
    this._$ = cheerio.load('<div></div>');
    this._el = this._$('div').first();
    this._parent = null;
    this._classList = new MockClassList(this._el);
  }

  get innerHTML() {
    return this._el.html() || '';
  }

  set innerHTML(html) {
    this._el.html(html);
  }

  get classList() {
    return this._classList;
  }

  get parentElement() {
    return this._parent;
  }

  get lastElementChild() {
    const children = this._el.children();
    if (children.length === 0) {
      return null;
    }
    const lastChild = children.last();
    const child = new MockElement();
    child._$ = this._$;
    child._el = lastChild;
    child._parent = this;
    child._classList = new MockClassList(lastChild);
    return child;
  }

  insertAdjacentHTML(position, html) {
    if (position === 'beforeend') {
      this._el.append(html);
    }
  }

  normalize() {
    // No-op for cheerio - DOM's normalize() merges adjacent text nodes
  }

}
