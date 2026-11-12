import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The articles cited by the answer.
 */
class MisoSourcesElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.SOURCES,
    });
  }

  static get tagName() {
    return 'miso-sources';
  }

}

export default MisoSourcesElement;
