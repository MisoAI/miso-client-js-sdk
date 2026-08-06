import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoSubscriptionElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.SUBSCRIPTION,
    });
  }

  static get tagName() {
    return 'miso-subscription';
  }

}
