import MisoUnitElement from './miso-unit.js';

const TAG_NAME = 'miso-explore';

export default class MisoExploreElement extends MisoUnitElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoUnitElement.observedAttributes;
  }

  _getWorkflowByUnitId(client, unitId) {
    return client.ui.explores.get(unitId);
  }

}
