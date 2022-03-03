import { trimObj } from './util/objects';

export default class Context {

  constructor(client) {
    this._client = client;
  }

  setUserId(id, hash) {
    this.user_id = id;
    this.user_hash = hash;
  }

  setAnonymousId(id, hash) {
    this.anonymous_id = id;
    this.anonymous_hash = hash;
  }

  clearUserId() {
    this.user_id = this.user_hash = undefined;
  }

  clearAnonymousId() {
    this.anonymous_id = this.anonymous_hash = undefined;
  }

  // TODO: readonly proxy

  get userInfo() {
    const { user_id, user_hash, anonymous_id, anonymous_hash } = this;
    return trimObj({ user_id, user_hash, anonymous_id, anonymous_hash });
  }

}
