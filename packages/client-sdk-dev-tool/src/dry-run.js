import { addUrlParameter } from '@miso.ai/commons';

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

  install(_, { addUrlPass }) {
    addUrlPass(this._modifyUrl.bind(this));
  }

  _modifyUrl({ apiGroup, apiName, url }) {
    return apiGroup === 'interactions' && apiName === 'upload' ? addUrlParameter(url, 'dry_run', '1') : url;
  }

}
