const TYPE = Object.freeze({
  CLEAR: 'clear',
  APPEND: 'append',
  SET: 'set',
  ASCEND: 'ascend',
  DESCEND: 'descend',
  SOLIDIFY: 'solidify',
});

export default class Operation {

  static get TYPE() {
    return TYPE;
  }

  static clear() {
    return new Operation({ type: TYPE.CLEAR });
  }

  static set(html) {
    return new Operation({ type: TYPE.SET, html });
  }

  static append(html) {
    return new Operation({ type: TYPE.APPEND, html });
  }

  static ascend(level = 1) {
    return new Operation({ type: TYPE.ASCEND, level });
  }

  static descend(level = 1) {
    return new Operation({ type: TYPE.DESCEND, level });
  }

  static solidify(html) {
    return new Operation({ type: TYPE.SOLIDIFY, html });
  }

  constructor(args) {
    Object.assign(this, args);
  }

  applyTo(element, ref) {
    const { type, level, html } = this;
    switch (type) {
      case TYPE.CLEAR:
        element.innerHTML = '';
        ref = element;
        break;
      case TYPE.APPEND:
        ref.insertAdjacentHTML('beforeend', html);
        break;
      case TYPE.SET:
        element.innerHTML = html;
        ref = element;
        break;
      case TYPE.ASCEND:
        for (let i = 0; i < level; i++) {
          ref = ref.parentElement;
        }
        break;
      case TYPE.DESCEND:
        for (let i = 0; i < level; i++) {
          ref = ref.lastElementChild;
        }
        break;
      case TYPE.SOLIDIFY:
        ref.innerHTML = html;
        break;
    }
    return ref;
  }

  toString() {
    switch (this.type) {
      case TYPE.CLEAR:
        return 'CLR';
      case TYPE.APPEND:
        return `APP('${summarize(this.html)}')`;
      case TYPE.SET:
        return `SET('${summarize(this.html)}')`;
      case TYPE.ASCEND:
        return `ASC(${this.level})`;
      case TYPE.DESCEND:
        return `DES(${this.level})`;
      case TYPE.SOLIDIFY:
        return `SLD(${summarize(this.html)})`;
    }
  }

}

function summarize(str) {
  const { length } = str;
  return length > 50 ? `${str.slice(0, 25)}...${str.slice(length - 25)}` : str;
}
