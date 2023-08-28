import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoResultsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.RESULTS,
    });
  }

  static get tagName() {
    return 'miso-results';
  }

}
