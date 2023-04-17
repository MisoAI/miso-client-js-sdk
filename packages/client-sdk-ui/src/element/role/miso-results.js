import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

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
