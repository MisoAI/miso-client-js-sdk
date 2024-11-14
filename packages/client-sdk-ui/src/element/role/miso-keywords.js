import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

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
