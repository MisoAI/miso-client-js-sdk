import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The articles related to the question.
 */
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
