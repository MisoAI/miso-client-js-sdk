import MisoComboElement from './miso-combo.js';

const TAG_NAME = 'miso-ask-combo';

/**
 * The pre-built Ask UI.
 * @deprecated Use `<miso-ask>` and its component elements instead.
 */
class MisoAskComboElement extends MisoComboElement {

  static get tagName() {
    return TAG_NAME;
  }

  constructor() {
    super();
  }

  _getCombo(MisoClient) {
    return MisoClient.ui.combo.ask;
  }

}

export default MisoAskComboElement;
