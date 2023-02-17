import { Registry } from '@miso.ai/commons';

export default class Widgets extends Registry {

  constructor(plugin) {
    super('widgets', plugin, {
      libName: 'widget',
      keyName: 'type',
    });
    this._plugin = plugin;
  }

  get(type) {
    return this._libraries[type];
  }

}
