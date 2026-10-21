import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The button that renames a thread.
 */
export default class MisoRenameElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.RENAME,
    });
  }

  static get tagName() {
    return 'miso-rename';
  }

}
