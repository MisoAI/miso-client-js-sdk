import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoFacetsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.FACETS,
    });
  }

  static get tagName() {
    return 'miso-facets';
  }

}
