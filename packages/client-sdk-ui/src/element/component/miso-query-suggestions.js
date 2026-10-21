import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The suggested questions to ask.
 */
export default class MisoQuerySuggestionsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.QUERY_SUGGESTIONS,
    });
  }

  static get tagName() {
    return 'miso-query-suggestions';
  }

}
