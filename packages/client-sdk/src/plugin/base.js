import { arrayRemoveItem, executeWithCatch } from '../util/objects';

export default class Plugin {

  constructor(type) {
    Object.defineProperty(this, 'type', { value: type });
  }

  install(client) {
    const plugins = client.plugins || (client.plugins = []);
    // deduplicate
    for (const plugin of plugins) {
      if (plugin.constructor === this.constructor) {
        return;
      }
    }
    executeWithCatch((self, client) => {
      // TODO: replace plugin of equal type
      self._install(client);
      plugins.push(self);
    }, [this, client]);
  }

  uninstall(client) {
    executeWithCatch((self, client) => {
      self._uninstall(client);
      arrayRemoveItem(client.plugins, self);
    }, [this, client]);
  }

  _install() {}

  _uninstall() {}

}
