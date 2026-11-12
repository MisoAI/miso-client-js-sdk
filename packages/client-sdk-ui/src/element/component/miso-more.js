import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The button that loads more search results.
 */
class MisoMoreElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.MORE,
    });
  }

  static get tagName() {
    return 'miso-more';
  }

}

export default MisoMoreElement;
