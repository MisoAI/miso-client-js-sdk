import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The images that come with the answer.
 */
class MisoImagesElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.IMAGES,
    });
  }

  static get tagName() {
    return 'miso-images';
  }

}

export default MisoImagesElement;
