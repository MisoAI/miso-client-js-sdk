import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The button that deletes a thread.
 */
class MisoDeleteElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.DELETE,
    });
  }

  static get tagName() {
    return 'miso-delete';
  }

}

export default MisoDeleteElement;
