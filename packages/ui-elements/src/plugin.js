import { delegateGetters } from '@miso.ai/commons';
import getRoot from './root';
import MisoListModel from './model/list';
import MisoListElement from './element/list';
import { PLUGIN_ID } from './constants';

export default class UiPlugin {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    const root = getRoot();
    delegateGetters(this, root, ['config', 'install']);
    
    // TODO: find a better place to bundle?
    root.models.register(MisoListModel);
    root.elements.register(MisoListElement);
  }

}
