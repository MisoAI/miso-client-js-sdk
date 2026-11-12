import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The list of the chat threads. The `group` attribute picks the thread group
 * it presents: `favorite` (the favorited threads), `unfavorite` (the rest),
 * or every thread when absent. It is read as the list renders and pages, so
 * set it before the element is connected.
 */
class MisoThreadsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.THREADS,
    });
  }

  static get tagName() {
    return 'miso-threads';
  }

}

export default MisoThreadsElement;
