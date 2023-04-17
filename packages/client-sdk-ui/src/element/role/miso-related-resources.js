import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

export default class MisoRelatedResourcesElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.RELATED_RESOURCES,
    });
  }

  static get tagName() {
    return 'miso-related-resources';
  }

}
