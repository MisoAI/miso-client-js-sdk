import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The star toggle that favorites (stars) a thread.
 */
export default class MisoFavoriteElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.FAVORITE,
    });
  }

  static get tagName() {
    return 'miso-favorite';
  }

}
