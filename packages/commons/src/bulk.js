import Resolution from './resolution';

export default class Bulk {

  constructor(runner, onError) {
    this._dispatchRequested = false;
    this._requests = [];
    this._run = runner;
    this._error = onError || (e => console.error(e));
    this._bulkId = 0;
    this._dispatch = this._dispatch.bind(this);
  }

  get info() {
    return {
      bulkId: this._bulkId,
      index: this._requests.length,
    };
  }

  async run(action) {
    const resolution = new Resolution();
    this._requests.push({ action, resolution });
    this._requestDispatch();
    return resolution.promise;
  }

  _requestDispatch() {
    if (this._dispatchRequested) {
      return;
    }
    this._dispatchRequested = true;
    setTimeout(this._dispatch);
  }

  _dispatch() {
    if (!this._dispatchRequested) {
      return;
    }
    this._dispatchRequested = false;
    const requests = this._requests;
    const bulkId = this._bulkId++;
    this._requests = [];
    try {
      this._run(requests, { bulkId });
    } catch(e) {
      this._error(e);
    }
  }

}
