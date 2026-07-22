import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoThreadsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.THREADS,
    });
  }

  static get tagName() {
    return 'miso-threads';
  }

}
