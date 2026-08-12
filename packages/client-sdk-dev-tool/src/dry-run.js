import { API, addUrlParameter } from '@miso.ai/commons';

const { GROUP, NAME } = API;

const ID = 'std:dry-run';

export default class DryRunPlugin {

  constructor(options = {}) {
    this._options = options;
    this.id = 'std:dry-run';
    this.name = 'dry-run';
  }

  static get id() {
    return ID;
  }

  // TODO: config({ active })

  install(_, { addUrlPass, addPayloadPass }) {
    addUrlPass(this._modifyUrl.bind(this));
    addPayloadPass(this._modifyPayload.bind(this));
  }

  _modifyUrl({ apiGroup, apiName, url }) {
    return apiGroup === 'interactions' && apiName === 'upload' ? addUrlParameter(url, 'dry_run', '1') : url;
  }

  _modifyPayload({ apiGroup, apiName, payload }) {
    if (!payload) {
      return payload; // the GET request
    }
    // questions (ask) and search (hybrid search) only, for now
    if (apiGroup === GROUP.ASK && (apiName === NAME.QUESTIONS || apiName === NAME.SEARCH)) {
      return { ...payload, with_request_history: false };
    }
    return payload;
  }

}
