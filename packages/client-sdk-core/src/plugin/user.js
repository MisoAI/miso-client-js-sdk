import { uuidv4, trimObj, delegateProperties } from '@miso.ai/commons';

const ID = 'std:user';

export default class UserPlugin {

  static get id() {
    return ID;
  }

  constructor() {
  }

  install(MisoClient, { addPayloadPass }) {
    MisoClient.on('create', this._injectClient.bind(this));
    addPayloadPass(this._modifyPayload.bind(this));
  }

  _injectClient(client) {
    const userContext = client._userContext = new UserContext();
    delegateProperties(client.context, userContext, ['anonymous_id', 'user_id', 'user_hash']);
  }

  _modifyPayload({ client, apiGroup, apiName, payload }) {
    return apiGroup === 'interactions' && apiName === 'upload' ?
      this._modifyPayloadForInteractions(client, payload) : this._modifyPayloadForOthers(client, payload);
  }

  _modifyPayloadForOthers(client, payload) {
    const { user_id, user_hash, anonymous_id } = client.context;
    const userInfo = user_id ? { user_id, user_hash } : { anonymous_id };
    return { ...userInfo, ...payload };
  }

  _modifyPayloadForInteractions(client, { data }) {
    const { anonymous_id, user_id } = client.context;
    const baseObj = trimObj({ anonymous_id, user_id });
    data = data.map(obj => ({ ...baseObj, ...obj }));
    return { data };
  }

}

const SESSION_KEY = 'miso-anonymous-id';
let autoAnonymousId;

function getAutoAnonymousId() {
  if (!autoAnonymousId) {
    autoAnonymousId = window.sessionStorage.getItem(SESSION_KEY);
  }
  if (!autoAnonymousId) {
    window.sessionStorage.setItem(SESSION_KEY, (autoAnonymousId = uuidv4()));
  }
  return autoAnonymousId;
}

class UserContext {

  constructor() {
    this._autoAnonymousId = getAutoAnonymousId();
  }

  get anonymous_id() {
    return this._anonymousId || this._autoAnonymousId;
  }

  set anonymous_id(value) {
    // TODO: validate value
    this._anonymousId = value;
  }

  get user_id() {
    return this._userId;
  }

  set user_id(value) {
    // TODO: validate value
    this._userId = value;
  }

  get user_hash() {
    return this._userHash;
  }

  set user_hash(value) {
    // TODO: validate value
    this._userHash = value;
  }

}
