import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The product results.
 */
class MisoProductsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.PRODUCTS,
    });
  }

  static get tagName() {
    return 'miso-products';
  }

}

export default MisoProductsElement;
