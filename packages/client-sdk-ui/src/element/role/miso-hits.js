import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoHitsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.HITS,
    });
  }

  static get tagName() {
    return 'miso-hits';
  }

}
