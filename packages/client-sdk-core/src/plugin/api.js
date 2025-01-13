import { Component, API } from '@miso.ai/commons';

const PLUGIN_ID = 'std:api';

export default class ApiPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('api');
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    context.addPayloadPass(this._suppressMetaObject.bind(this));
  }

  _suppressMetaObject(args) {
    if (!this._shallSuppressMetaObject(args)) {
      return payload;
    }
    const { payload: { _meta, ...payload } = {} } = args;
    return payload;
  }

  _shallSuppressMetaObject({ apiGroup, apiName }) {
    switch (apiGroup) {
      case API.GROUP.SEARCH:
      case API.GROUP.RECOMMENDATION:
        return true;
    }
    return false;
  }

}
