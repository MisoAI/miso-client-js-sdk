import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The title of a thread.
 */
export default class MisoTitleElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.TITLE,
    });
  }

  static get tagName() {
    return 'miso-title';
  }

}
