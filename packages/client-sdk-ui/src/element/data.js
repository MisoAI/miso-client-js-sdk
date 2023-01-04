import { mixinReadinessInstance, mixinReadinessPrototype } from '@miso.ai/commons';
import MisoElement from './base';
import root from '../root';

const OBSERVED_ATTRIBUTES = MisoElement.observedAttributes.concat(['auto-model', 'model', 'api', 'payload', 'transform']);
const ATTR_TO_PROPS = {
  'auto-model': ['autoModel', 'boolean'],
  model: 'modelType',
  api: 'api',
  payload: 'payload',
  transform: 'transform',
};

export default class MisoDataElement extends MisoElement {

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor(defaultModelType) {
    super({ attrToProps: ATTR_TO_PROPS });
    this._autoModel = true;
    this._modelOptions = { type: defaultModelType };
    mixinReadinessInstance(this);
  }

  get autoModel() {
    return this._autoModel;
  }

  get model() {
    return this._model;
  }

  get modelType() {
    return this._getModelProp('type');
  }

  get api() {
    return this._getModelProp('api');
  }

  get payload() {
    return this._getModelProp('payload');
  }

  get transform() {
    return this._getModelProp('transform');
  }

  _getModelProp(name) {
    return this._model ? this._model[name] : this._modelOptions[name];
  }

  set autoModel(value) {
    if (this._autoModel === value) {
      return;
    }
    this._autoModel = value;
    if (!value) {
      // true -> false
      if (this._model) {
        throw new Error(`The model has already been set.`);
      }
    } else {
      // false -> true
      if (this._initialized) {
        this._requestCreateModel();
      }
    }
  }

  set model(model) {
    if (!model) {
      throw new Error(`Cannot set model to empty: ${model}.`);
    }
    if (this._model && this._model !== model) {
      throw new Error(`The model has already been set.`);
    }
    this._model = model;
    this._setupModel(model);
    this._setReady();
  }

  set modelType(value) {
    if (this._model) {
      throw new Error(`Cannot set model type as the model has been set.`);
    }
    if (!value) {
      throw new Error(`Model type cannot be empty.`);
    }
    if (!root().models.isRegistered(value)) {
      throw new Error(`Unrecognized model type: ${value}`);
    }
    this._modelOptions.type = value;
  }

  set api(value) {
    this._modelOptions.api = value;
  }

  set payload(value) {
    if (typeof value === 'string') {
      value = JSON.parse(value);
    }
    // TODO: more validations
    this._modelOptions.payload = value;
  }

  set transform(value) {
    if (typeof value !== 'function') {
      throw new Error(`Transform value must be a function: ${value}`);
    }
    this._modelOptions.transform = value;
  }

  _init() {
    super._init();
    // build model if parameters are satisfied
    this._requestCreateModel();
  }

  _requestCreateModel() {
    // wait for next event loop, for the children elements may not be there yet
    setTimeout(this._createModelIfReady.bind(this));
  }

  _createModelIfReady() {
    // TODO: we may want to throw error message for api option absence
    if (this._model || !this._autoModel) {
      return;
    }
    if (!this._modelOptions.api) {
      throw new Error(`Require api attribute to create data model automatically.`);
    }
    this.model = root().models.create(this._modelOptions);
  }

  _setupModel(model) {}

  _command(command) {
    (async () => {
      await this.whenReady();
      try {
        (this._model[command])();
      } catch(e) {
        this._error(e);
      }
    })();
  }

}

mixinReadinessPrototype(MisoDataElement.prototype);
