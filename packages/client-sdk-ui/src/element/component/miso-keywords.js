import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The query text the results are for.
 */
export default class MisoKeywordsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.KEYWORDS,
    });
  }

  static get tagName() {
    return 'miso-keywords';
  }

}
