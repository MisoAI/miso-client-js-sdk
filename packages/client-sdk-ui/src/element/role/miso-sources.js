import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

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
