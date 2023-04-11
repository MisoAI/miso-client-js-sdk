import { getClient } from './utils';

const TAG_NAME = 'miso-custom';

const ATTR_WORKFLOW = 'workflow';
const ATTR_ROLE = 'role';
const ATTR_UNIT_ID = 'unit-id';

const OBSERVED_ATTRIBUTES = Object.freeze([
  ATTR_WORKFLOW,
  ATTR_ROLE,
  ATTR_UNIT_ID,
]);

export default class MisoCustomElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  // properties //
  get unitId() {
    return this.getAttribute(ATTR_UNIT_ID) || undefined;
  }

  get workflow() {
    return this.getAttribute(ATTR_WORKFLOW) || undefined;
  }

  get role() {
    return this.getAttribute(ATTR_ROLE) || undefined;
  }

  // lifecycle //
  async connectedCallback() {
    // find client & auto bind
    const client = await getClient();
    // TODO: if disconnected already, abort
    const { workflow, role } = this;
    if (!workflow) {
      concole.error(`Attribute "${ATTR_WORKFLOW}" is required.`);
    }
    if (!role) {
      concole.error(`Attribute "${ATTR_ROLE}" is required.`);
    }
    switch (workflow) {
      case 'recommendation':
        client.ui.recommendation.get(this.unitId).bind(role, this);
        break;
      case 'search':
        client.ui.search.bind(role, this);
        break;
      case 'ask':
        client.ui.ask.bind(role, this);
        break;
      default:
        // TODO: custom workflow
        concole.error(`Unsupported group: "${workflow}".`);
    }
  }

  disconnectedCallback() {
    // TODO
  }

}
