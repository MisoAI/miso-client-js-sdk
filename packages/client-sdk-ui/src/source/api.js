const DEFAULT_API_PARAMS = Object.freeze({
  name: 'user_to_products',
  payload: Object.freeze({
    fl: ['*'],
  }),
});

export default class ApiDataSource {

  constructor(client) {
    this._client = client;
    //this._apiName;
    //this._parameters = DEFAULT_API_PARAMS;
  }

  setParameters(name, payload) {
    // TODO: validation
    this._name = name;
    this._payload = payload;
  }

  get name() {
    return this._name;
  }

  get payload() {
    return this._payload;
  }

  /*
  get parameters() {
    return this._parameters;
  }

  set parameters(parameters) {
    // TODO: validation?
    this._parameters = Object.freeze({
      ...DEFAULT_API_PARAMS,
      ...parameters,
    });
  }
  */

  async supply({ uuid }) {
    if (!this._name) {
      throw new Error(`API name is required.`);
    }
    //const { name, payload } = this._parameters;
    // TODO: send uuid
    return this._client.api.recommendation._run(this._name, this._payload);
  }

}
