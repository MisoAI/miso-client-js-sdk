import MisoUnitElement from './miso-unit.js';

const TAG_NAME = 'miso-recommendation';

export default class MisoRecommendationElement extends MisoUnitElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoUnitElement.observedAttributes;
  }

  _getWorkflowByUnitId(client, unitId) {
    return client.ui.recommendations.get(unitId);
  }

}
