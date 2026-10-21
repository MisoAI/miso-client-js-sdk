import MisoUnitElement from './miso-unit.js';

const TAG_NAME = 'miso-recommendation';

/**
 * The container of the Recommendation workflow of a unit.
 */
export default class MisoRecommendationElement extends MisoUnitElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoUnitElement.observedAttributes;
  }

  _getWorkflowByUnitId(client, unitId) {
    return client.workflows.recommendations.get(unitId);
  }

}
