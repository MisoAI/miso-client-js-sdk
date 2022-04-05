import { delegateGetters } from '@miso.ai/commons';
import getRoot from './root';
import MisoListModel from './model/list';
import MisoListElement from './element/list';

export default class UiPlugin {

  static get id() {
    return 'std:ui';
  }

  constructor() {
    const root = getRoot();
    delegateGetters(this, root, ['config', 'install']);
    
    // TODO: find a better place to bundle?
    root.models.register(MisoListModel);
    root.elements.register(MisoListElement);

    root.ui.MisoListModel = MisoListModel;
  }

}
