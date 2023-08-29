import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoProductsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.PRODUCTS,
    });
  }

  static get tagName() {
    return 'miso-products';
  }

}
