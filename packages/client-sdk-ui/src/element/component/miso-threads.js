import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The list of the chat threads.
 */
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
