export default class Template {

  constructor(name, fn) {
    this._name = name;
    this._fn = fn;
  }

  render(data) {
    return this._fn(data);
  }

}
