import { Registry } from '@miso.ai/commons';

export default class ModelRegistry extends Registry {

  constructor(root) {
    super('models', root, {
      libName: 'data model',
      keyName: 'type',
    });
    this._root = this.meta._parent;
    this._models = [];
    this.classes = {};
  }

  create({ type, ...options }) {
    const modelClass = this._libraries[type];
    if (!modelClass) {
      throw new Error(`Model class of type not found: ${type}`);
    }
    const model = new modelClass(options);
    this._models.push(model);
    return model;
  }

  _register(lib) {
    super._register(lib);
    if (lib.className) {
      this.classes[lib.className] = lib;
    }
  }

}
