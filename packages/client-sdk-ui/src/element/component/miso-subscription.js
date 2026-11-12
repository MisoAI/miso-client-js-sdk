import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The toggle that subscribes a thread to answer updates.
 */
class MisoSubscriptionElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.SUBSCRIPTION,
    });
  }

  static get tagName() {
    return 'miso-subscription';
  }

}

export default MisoSubscriptionElement;
