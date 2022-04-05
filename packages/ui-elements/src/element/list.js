import { htmlToElement, replaceChildren } from './util';
import MisoDataElement from './data';
import MisoListModel from '../model/list';

const TAG_NAME = 'miso-list';
const OBSERVED_ATTRIBUTES = MisoDataElement.observedAttributes.concat([]);

export default class MisoListElement extends MisoDataElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super(MisoListModel.type);
    this._setTemplate('container', () => `<div></div>`);
    this._setTemplate('items', items => items.map(item => this.template('item').render(item)).join(''));
  }

  _init() {
    let container = this.template('container').render();
    if (typeof container === 'string') {
      container = htmlToElement(container);
    }
    this.appendChild(this._elements.container = container);
    super._init();
  }

  _setupModel(model) {
    model.on('replace', this._handleReplace.bind(this));
    // TODO: load on start options
    model.load();
  }

  _handleReplace({ data }) {
    replaceChildren(this._elements.container, this.template('items').render(data.items));
  }

}
