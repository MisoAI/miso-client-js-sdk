import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoResultsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.PRODUCTS,
    });
  }

  connectedCallback() {
    console.warn('Element <miso-results> is deprecated. Please use <miso-products> instead.');
    super.connectedCallback();
  }

  static get tagName() {
    return 'miso-results';
  }

}
