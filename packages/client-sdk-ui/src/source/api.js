export default class ApiDataSource {

  constructor(client) {
    this._client = client;
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

  async supply({ uuid }) {
    if (!this._name) {
      throw new Error(`API name is required.`);
    }
    // TODO: send uuid
    return this._client.api.recommendation._run(this._name, this._payload);
  }

}
