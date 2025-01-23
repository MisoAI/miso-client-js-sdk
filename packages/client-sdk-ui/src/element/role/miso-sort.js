import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoSortElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.SORT,
    });
  }

  static get tagName() {
    return 'miso-sort';
  }

}
