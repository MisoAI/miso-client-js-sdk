import { Registry } from '@miso.ai/commons';

export default class Layouts extends Registry {

  constructor(plugin) {
    super('layouts', plugin, {
      libName: 'layout',
      keyName: lib => lib.type,
    });
    this._plugin = plugin;
  }

  // TODO: API to override default options per layout

  get(name) {
    return this._libraries[name];
  }

  create(name, options) {
    if (name === false) {
      return undefined;
    }
    switch (typeof name) {
      case 'function':
        return { render: name };
      case 'string':
        const LayoutClass = this.get(name);
        if (!LayoutClass) {
          throw new Error(`Layout of name '${name}' not found.`);
        }
        return new LayoutClass(options);
      default:
        throw new Error(`Expect a string, a render function, or boolean value false: ${name}`);
    }
  }

}
