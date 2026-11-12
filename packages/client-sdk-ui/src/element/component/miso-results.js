import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * @deprecated Use `<miso-products>` (MisoProductsElement) instead.
 */
class MisoResultsElement extends MisoComponentElement {

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

export default MisoResultsElement;
