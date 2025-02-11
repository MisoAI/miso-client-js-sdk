import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoImagesElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.IMAGES,
    });
  }

  static get tagName() {
    return 'miso-images';
  }

}
