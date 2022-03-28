import { trimObj } from '@miso.ai/commons/dist/es/objects';
import Component from './util/component';

export default class Context extends Component {

  constructor(client) {
    super('context', client);
    this._client = client;
    this._anonymousIdManager = new client.constructor.lib.mods.anonymousId();
    this._user = {};
  }

  get anonymous_id() {
    return this._anonymousIdManager.id;
  }

  set anonymous_id(id) {
    if (typeof id !== 'string') {
      throw new Error(`Anonymous ID must be a string: ${id}`);
    }
    this._anonymousIdManager.id = id;
  }

  get user_id() {
    return this._user.id;
  }

  set user_id(id) {
    if (typeof id !== 'string') {
      throw new Error(`User ID must be a string: ${id}`);
    }
    this._user.id = id;
  }

  get user_hash() {
    return this._user.hash;
  }

  set user_hash(hash) {
    if (typeof hash !== 'string') {
      throw new Error(`User hash must be a string: ${hash}`);
    }
    this._user.hash = hash;
  }

  // TODO: readonly proxy

  get userInfo() {
    const { user_id, user_hash, anonymous_id } = this;
    return trimObj({ user_id, user_hash, anonymous_id });
  }

}
