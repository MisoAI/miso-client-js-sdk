import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

export default class MisoQueryElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.QUERY,
    });
  }

  static get tagName() {
    return 'miso-query';
  }

}
