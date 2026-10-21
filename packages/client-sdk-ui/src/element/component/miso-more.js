import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The button that loads more search results.
 */
export default class MisoMoreElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.MORE,
    });
  }

  static get tagName() {
    return 'miso-more';
  }

}
