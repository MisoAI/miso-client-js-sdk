import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

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
