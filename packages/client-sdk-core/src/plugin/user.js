import { API, uuidv4, asString, trimObj, Component, delegateProperties, getOrComputeFromStorage } from '@miso.ai/commons';

const { GROUP, NAME } = API;

const PLUGIN_ID = 'std:user';

export default class UserPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('user');
    this._contexts = new WeakMap();
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));
    context.addPayloadPass(this._modifyPayload.bind(this));
  }

  _injectClient(client) {
    const context = new UserContext(this);
    this._contexts.set(client, context);
    delegateProperties(client.context, context, ['anonymous_id', 'user_id', 'user_hash']);
  }

  _modifyPayload({ client, apiGroup, apiName, payload }) {
    if (apiGroup === GROUP.INTERACTIONS && apiName === NAME.UPLOAD) {
      return this._modifyPayloadForInteractions(client, payload);
    }
    if (apiGroup === GROUP.ASK && apiName === NAME.QUESTIONS) {
      return this._modifyPayloadForAsk(client, payload);
    }
    return this._modifyPayloadForOthers(client, payload);
  }

  _modifyPayloadForOthers(client, payload) {
    const { user_id, user_hash, anonymous_id } = client.context;
    const userInfo = user_id ? { user_id, user_hash } : { anonymous_id };
    return { ...userInfo, ...payload };
  }

  _modifyPayloadForAsk(client, payload) {
    const { user_id, user_hash, user_type, anonymous_id } = client.context;
    const userInfo = user_id ? { user_id, user_hash } : { anonymous_id };
    if (user_id && user_type) {
      userInfo.user_type = user_type;
    }
    return { ...userInfo, ...payload };
  }

  _modifyPayloadForInteractions(client, { data }) {
    const { anonymous_id, user_id } = client.context;
    const baseObj = trimObj({ anonymous_id, user_id });
    data = data.map(obj => ({ ...baseObj, ...obj }));
    return { data };
  }

}

function getAutoAnonymousId() {
  return getOrComputeFromStorage('miso_anonymous_id', uuidv4);
}

class UserContext {

  constructor(plugin) {
    this._plugin = plugin;
  }

  get anonymous_id() {
    return this._anonymousId || this._autoAnonymousId || (this._autoAnonymousId = getAutoAnonymousId());
  }

  set anonymous_id(value) {
    value = asString(value);
    this._anonymousId = value;
    this._plugin._events.emit('set', `anonymous_id = '${value}'`);
  }

  get user_id() {
    return this._userId;
  }

  set user_id(value) {
    value = asString(value);
    this._userId = value;
    this._plugin._events.emit('set', `user_id = '${value}'`);
  }

  get user_hash() {
    return this._userHash;
  }

  set user_hash(value) {
    if (typeof value !== 'string' && typeof value !== 'undefined') {
      throw new Error(`User hash must be a string`);
    }
    this._userHash = value;
    this._plugin._events.emit('set', `user_hash = '${value}'`);
  }

  get user_type() {
    return this._userType;
  }

  set user_type(value) {
    this._userType = value;
    this._plugin._events.emit('set', `user_type = '${value}'`);
  }

}
