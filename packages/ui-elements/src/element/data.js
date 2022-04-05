import { mixinReadinessInstance, mixinReadinessPrototype } from '@miso.ai/commons';
import MisoElement from './base';
import root from '../root';

const OBSERVED_ATTRIBUTES = ['model', 'api', 'payload'];
const ATTR_TO_PROPS = {
  model: 'modelType',
  api: 'api',
  payload: 'payload',
  onstart: 'onstart',
  onview: 'onview',
};

export default class MisoDataElement extends MisoElement {

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor(defaultModelType) {
    super();
    this._attrToProps = { ...super._attrToProps, ...ATTR_TO_PROPS };
    this._modelOptions = { type: defaultModelType };
    mixinReadinessInstance(this);
  }

  get model() {
    return this._model;
  }

  get modelType() {
    return this._model ? this._model.type : this._modelOptions.type;
  }

  get api() {
    return this._modelOptions.api;
  }

  get payload() {
    return this._modelOptions.payload;
  }

  set model(model) {
    if (!model) {
      throw new Error(`Cannot set model to empty: ${model}.`);
    }
    if (this._model && this._model !== model) {
      throw new Error(`The model has already been set.`);
    }
    this._model = model;
    this._setReady();
  }

  set payload(value) {
    if (typeof value === 'string') {
      value = JSON.parse(value);
    }
    // TODO: more validations
    this._modelOptions.payload = value;
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

  _init() {
    // build model if parameters are satisfied
    this._createModelIfReady();

    super._init();

    (async () => {
      if (!this._model) {
        await this.whenReady();
      }
      this._setupModel(this._model);
    })();
  }

  _createModelIfReady() {
    if (this._model || !this._modelOptions.api) {
      return;
    }
    this.model = root().models.create(this._modelOptions);
  }

  _setupModel(model) {}

}

mixinReadinessPrototype(MisoDataElement.prototype);
