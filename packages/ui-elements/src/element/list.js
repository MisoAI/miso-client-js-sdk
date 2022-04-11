import { asElement, replaceChildren } from './util';
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
    this.templates.set('container', () => `<div></div>`);
  }

  _init() {
    super._init();
    this.appendChild(this._elements.container = asElement(this.templates.get('container').render()));
  }

  _setupModel(model) {
    super._setupModel(model);
    model.on('replace', this._handleReplace.bind(this));
  }

  _handleReplace({ data }) {
    replaceChildren(this._elements.container, data.items.map(item => asElement(this.templates.get('item').render(item))));
    this._emit('replace');
  }

}
