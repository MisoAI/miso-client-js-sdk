import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The star toggle that favorites (stars) a thread.
 *
 * @since 1.14.2
 */
class MisoFavoriteElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.FAVORITE,
    });
  }

  static get tagName() {
    return 'miso-favorite';
  }

}

export default MisoFavoriteElement;
