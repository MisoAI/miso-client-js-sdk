import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The query box.
 */
export default class MisoQueryElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.QUERY,
    });
  }

  static get tagName() {
    return 'miso-query';
  }

}
