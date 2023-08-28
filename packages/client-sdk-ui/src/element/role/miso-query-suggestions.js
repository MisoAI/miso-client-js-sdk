import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

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
