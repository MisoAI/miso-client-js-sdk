import { Component, API } from '@miso.ai/commons';

const PLUGIN_ID = 'std:api-patch';

export default class ApiPatchPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('api-patch');
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    context.addPayloadPass(this._patchApiPayload.bind(this));
  }

  _patchApiPayload(args) {
    let { payload, ...rest } = args;
    if (!payload) {
      return payload; // the GET request
    }
    payload = this._copyMetadataToMeta(payload, rest);
    payload = this._suppressMetadata(payload, rest);
    payload = this._suppressUserType(payload, rest);
    return payload;
  }

  _copyMetadataToMeta(payload, { apiGroup }) {
    switch (apiGroup) {
      case API.GROUP.ASK:
        if (payload.metadata) {
          return {
            ...payload,
            _meta: payload.metadata,
          };
        }
        return payload;
      default:
        return payload;
    }
  }

  _suppressMetadata(payload, { apiGroup }) {
    switch (apiGroup) {
      case API.GROUP.SEARCH:
      case API.GROUP.RECOMMENDATION:
        const { _meta, metadata, ...rest } = payload;
        return rest;
      default:
        return payload;
    }
  }

  _suppressUserType(payload, { apiGroup }) {
    switch (apiGroup) {
      case API.GROUP.SEARCH:
      case API.GROUP.RECOMMENDATION:
        const { user_type, ...rest } = payload;
        return rest;
      default:
        return payload;
    }
  }

}
