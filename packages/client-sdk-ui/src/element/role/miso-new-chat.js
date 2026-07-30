import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoNewChatElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.NEW_CHAT,
    });
  }

  static get tagName() {
    return 'miso-new-chat';
  }

}
