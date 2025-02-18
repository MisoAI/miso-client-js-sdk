export function setOrRemoveAttribute(element, name, value) {
  if (value === undefined) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}

export function addOrRemoveClass(element, name, add) {
  if (add) {
    element.classList.add(name);
  } else {
    element.classList.remove(name);
  }
}

export function resolveCssLength(str) {
  if (typeof str === 'number') {
    return str;
  }
  const [value, unit] = parseLength(str);
  switch (unit) {
    case '':
    case 'px':
      return value;
    case 'rem':
      return remToPx(value);
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

function parseLength(str) {
  const match = str.match(/^([+-]?(?:\d+|\d*\.\d+))([a-z]*)$/);
  if (!match) {
    throw new Error(`Invalid length: ${str}`);
  }
  const value = parseFloat(match[1]);
  const unit = match[2] || '';
  return [value, unit];
}

function remToPx(value = 1) {
  return value * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function cssAspectRatio(value) {
  return (value === undefined || value instanceof CssAspectRatio) ? value : new CssAspectRatio(value);
}

class CssAspectRatio {

  constructor(value) {
    this._width = NaN;
    this._height = NaN;
    switch (typeof value) {
      case 'number':
        this._width = value;
        this._height = 1;
        break;
      case 'object':
        if (Array.isArray(value)) {
          this._width = parseFloat(value[0]);
          this._height = parseFloat(value[1]);
        }
        break;
      case 'string':
        const i = value.indexOf('/');
        if (i < 0) {
          this._width = parseFloat(value);
          this._height = 1;
        } else {
          this._width = parseFloat(value.slice(0, i).trim());
          this._height = parseFloat(value.slice(i + 1).trim());
        }
        break;
    }
    if (this._width === NaN || this._height === NaN) {
      throw new Error(`Invalid aspect ratio value: ${value}`);
    }
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get floatValue() {
    return this._width / this._height;
  }

  scaleBy(factor) {
    factor = cssAspectRatio(factor);
    return cssAspectRatio([factor._width * this._width, factor._height * this._height]);
  }

  toString() {
    return this._height === 1 ? `${this._width}` : `${this._width} / ${this._height}`;
  }
}
