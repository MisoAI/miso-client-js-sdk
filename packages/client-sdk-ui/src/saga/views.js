import { defineValues } from '@miso.ai/commons';
import { STATUS } from '../constants';
import * as fields from './fields';
import ViewReactor from './view';

export default class ViewsReactor {

  constructor(saga, roles = []) {
    this._saga = saga;
    this._views = {};
    for (const role of roles) {
      this._views[role] = new ViewReactor(this, role);
    }

    defineValues(saga, {
      views: new Views(this),
    });

    const syncSize = () => this.syncSize();
    window.addEventListener('resize', syncSize);

    this._unsubscribes = [
      () => window.removeEventListener('resize', syncSize),
      saga.on(fields.data(), () => this.refresh()),
    ];
  }

  get(role) {
    return this._views[role] || (this._views[role] = new ViewReactor(this, role));
  }

  syncSize() {
    for (const view of Object.values(this._views)) {
      view.syncSize();
    }
  }

  async refresh({ force } = {}) {
    const data = this._getData();
    await Promise.all(Object.values(this._views).map(view => view.refresh({ force, data })));
  }

  _getData() {
    const { data } = this._saga.states;
    // compare to cached
    if (!this._data || this._data.data !== data) {
      const status = (!data || !data.session || !data.session.active) ? STATUS.INITIAL :
        data.error ? STATUS.ERRONEOUS : data.value ? STATUS.READY : STATUS.LOADING;
      this._data = Object.freeze({ ...data, status });
    }
    return this._data;
  }

  _error(e) {
    // TODO: saga trigger error event
    console.error(e);
  }

  destroy() {
    for (const view of Object.values(this._views)) {
      view._destroy();
    }
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}

class Views {

  constructor(reactor) {
    this._reactor = reactor;
  }

  // TODO

}