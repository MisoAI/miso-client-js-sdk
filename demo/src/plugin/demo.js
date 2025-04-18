import LocalStorageProperty from "../util/local-storage-property";
import * as helpers from './helpers/index.js';

// inject with .env or process.env
const DEFAULT_API_KEY = __DEFAULT_API_KEY__;
const DEFAULT_ASK_API_KEY = __DEFAULT_ASK_API_KEY__;
//const DEFAULT_USER_ID = __DEFAULT_USER_ID__;
const ID = 'demo';

export default class DemoPlugin {

  static get id() {
    return ID;
  }

  constructor() {
    /*
    this._settings = new LocalStorageProperty({
      key: 'miso-sdk-demo::apps-settings',
      createDefaultValue: () => ({}),
    });
    */
    this._selection = new LocalStorageProperty({
      key: 'miso-sdk-demo::apps-selection',
      createDefaultValue: () => ({
        //apiKey: DEFAULT_API_KEY,
        //userId: DEFAULT_USER_ID,
      }),
    });
  }

  get selection() {
    return this._selection.value;
  }

  reset() {
    this._selection.reset();
  }

  install(MisoClient) {
    window.helpers = helpers;

    const selection = this._selection;

    // inject client options
    const _normalizeOptions = MisoClient.prototype._normalizeOptions;
    MisoClient.prototype._normalizeOptions = function(options) {
      if (typeof options === 'string' && options !== '...') {
        options = { apiKey: options };
      }
      return _normalizeOptions.call(this, {
        apiKey: options && options.type !== 'ask' ? DEFAULT_API_KEY : DEFAULT_ASK_API_KEY,
        //apiKey: selection.value.apiKey,
        ...options,
      });
    }

    // set user id and user hash on create
    MisoClient.on('create', (client) => {
      const { userId, userHash } = selection.value;
      if (userId) {
        client.context.user_id = userId;
        client.context.user_hash = userHash;
      }
    });

    // react on update
    selection.onUpdate((newValue = {}, oldValue = {}) => {  
      const { apiKey: newApiKey, userId: newUserId, userHash: newUserHash } = newValue;
      const { apiKey: oldApiKey, userId: oldUserId, userHash: oldUserHash } = oldValue;

      if (newApiKey !== oldApiKey) {
        window.location.reload();
        return;
      }
      if (newUserId !== oldUserId || newUserHash !== oldUserHash) {
        for (const client of MisoClient.instances) {
          client.context.user_id = newUserId;
          client.context.user_hash = newUserHash;
        }
      }
    });
  }

}
