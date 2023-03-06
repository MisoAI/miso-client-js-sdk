import { Registry } from '@miso.ai/commons';

export default class Layouts extends Registry {

  constructor(plugin) {
    super('layouts', plugin, {
      libName: 'layout',
      keyName: 'type',
    });
    this._plugin = plugin;
  }

  get(type) {
    return this._libraries[type];
  }

}
