import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * @deprecated Use `<miso-follow-up-questions>` (MisoFollowUpQuestionsElement) instead.
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
