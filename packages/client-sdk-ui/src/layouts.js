import { Registry } from '@miso.ai/commons';

function getKey(role, name) {
  return `${role}${name ? `:${name}` : ''}`;
}

export default class Layouts extends Registry {

  constructor(plugin) {
    super('layouts', plugin, {
      libName: 'layout',
      keyName: lib => getKey(lib.role, lib.type),
    });
    this._plugin = plugin;
  }

  get(role, name) {
    return this._libraries[getKey(role, name)];
  }

  create(role, name, options) {
    if (role === false) {
      return undefined;
    }
    if (typeof name === 'object') {
      options = name;
      name = undefined;
    }
    switch (typeof role) {
      case 'function':
        return { render: name };
      case 'string':
        const key = getKey(role, name);
        const LayoutClass = this.get(key);
        if (!LayoutClass) {
          throw new Error(`Layout of role/name '${key}' not found.`);
        }
        return new LayoutClass(options);
      default:
        throw new Error(`Expect a string, a render function, or boolean value false: ${role}`);
    }
  }

}
