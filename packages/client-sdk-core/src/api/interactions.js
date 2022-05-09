import ApiBase from './base';

export default class Interactions extends ApiBase {

  constructor(api) {
    super(api, 'interactions');
  }

  async upload(payload, options) {
    try {
      return await this._run('upload', payload, options);
    } catch (e) {
      if (e.status === 400 && e.message && e.message.toLowerCase().indexOf('playground') > -1) {
        this._warn(`Ignore interactions uploaded to playground app.`);
      } else {
        throw e;
      }
    }
  }

  _url() {
    return this.helpers.url(this._apiPath);
  }

  _preprocess({ apiName, payload }) {
    if (apiName === 'upload') {
      payload = this._normalizeUploadPayload(payload);
    }
    return super._preprocess({ apiName, payload });
  }

  _normalizeUploadPayload(payload) {
    // TODO: accept string as a shortcut of { type: payload } as well
    if (typeof payload !== 'object') {
      throw new Error(`Interactions payload has to be either an object or an array of objects: ${payload}`);
    }
    if (!Array.isArray(payload)) {
      payload = [payload];
    }
    return { data: payload };
  }

}
