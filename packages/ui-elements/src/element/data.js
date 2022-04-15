import { mixinReadinessInstance, mixinReadinessPrototype } from '@miso.ai/commons';
import MisoElement from './base';
import root from '../root';

const OBSERVED_ATTRIBUTES = MisoElement.observedAttributes.concat(['model', 'api', 'payload']);
const ATTR_TO_PROPS = {
  model: 'modelType',
  api: 'api',
  payload: 'payload',
  transform: 'transform',
};

// TODO: rename to PrimaryElement

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
    // TODO: use delegate util
    return this._modelOptions.api;
  }

  get payload() {
    return this._modelOptions.payload;
  }

  get transform() {
    return this._modelOptions.transform;
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
    // wait for next event loop, for the children elements may not be there yet
    setTimeout(this._createModelIfReady.bind(this));
  }

  _createModelIfReady() {
    // TODO: we may want a more explicit rule to determine when to create model
    if (this._model || !this._modelOptions.api) {
      return;
    }
    this.model = root().models.create(this._modelOptions);
  }

  _setupModel(model) {}

  _commend(command) {
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
