import Component from './util/component';
import { trimObj } from './util/objects';

export default class Context extends Component {

  constructor(client) {
    super('context', client);
    this._client = client;
    this._anonymousIdManager = new client.constructor.mods.anonymousId();
    this._user = {};
  }

  get anonymous_id() {
    return this._anonymousIdManager.id;
  }

  set anonymous_id(id) {
    this._anonymousIdManager.id = id;
  }

  get user_id() {
    return this._user.id;
  }

  set user_id(id) {
    this._user.id = id;
  }

  get user_hash() {
    return this._user.hash;
  }

  set user_hash(hash) {
    this._user.hash = hash;
  }

  // TODO: readonly proxy

  get userInfo() {
    const { user_id, user_hash, anonymous_id } = this;
    return trimObj({ user_id, user_hash, anonymous_id });
  }

}
