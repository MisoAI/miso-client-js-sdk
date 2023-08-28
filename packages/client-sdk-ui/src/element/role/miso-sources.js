import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoSourcesElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.SOURCES,
    });
  }

  static get tagName() {
    return 'miso-sources';
  }

}
