import { API, uuidv4, Component, delegateProperties, getOrComputeFromStorage, mergeInteractions, mergeApiPayloads } from '@miso.ai/commons';

const { GROUP, NAME } = API;

const PLUGIN_ID = 'std:context';

export default class ContextPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('context');
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));
    context.addHeadersPass(this._modifyHeaders.bind(this));
    context.addPayloadPass(this._modifyPayload.bind(this));
  }

  _injectClient(client) {
    const context = new ClientContext(this);
    delegateProperties(client.context, context, ['anonymous_id', 'user_id', 'user_hash', 'user_type', 'site', 'auth']);
  }

  _modifyHeaders({ client, headers }) {
    const { auth } = client.context;
    if (auth) {
      headers = { ...headers, Authorization: auth };
    }
    return headers;
  }

  _modifyPayload({ client, apiGroup, apiName, payload }) {
    if (!payload) {
      return payload; // the GET request
    }
    switch (apiGroup) {
      case GROUP.INTERACTIONS:
        if (apiName === NAME.UPLOAD) {
          return this._modifyPayloadForInteractions(client, payload);
        }
        return payload;
      default:
        return this._modifyPayloadForQueries(client, payload);
    }
  }

  _modifyPayloadForQueries(client, payload) {
    const { user_id, user_hash, user_type, anonymous_id, site } = client.context;
    const userInfo = user_id ? { user_id, user_type, user_hash } : { anonymous_id };
    const metadata = site ? { site } : undefined;
    return mergeApiPayloads(payload, { ...userInfo, metadata });
  }

  _modifyPayloadForInteractions(client, { data }) {
    const { anonymous_id, user_id, site } = client.context;
    const userInfo = { anonymous_id, user_id };
    const custom_context = site ? { site } : undefined;
    const context = custom_context ? { custom_context } : undefined;
    data = data.map(obj => mergeInteractions(obj, { ...userInfo, context }));
    return { data };
  }

}

let _pageBasedAutoAnonymousId;

function getAutoAnonymousId() {
  // 1. Cache the value for the page
  // 2. Get and set the value from cookies/localStorage is possible
  // 3. In case cookies/localStorage are disabled, generate a new value for each page
  return _pageBasedAutoAnonymousId || (_pageBasedAutoAnonymousId = getOrComputeFromStorage('miso_anonymous_id', uuidv4));
}

class ClientContext {

  constructor(plugin) {
    this._plugin = plugin;
    this._props = {};
  }

  get anonymous_id() {
    return this._props.anonymous_id || getAutoAnonymousId();
  }

  set anonymous_id(value) {
    this._requireString('anonymous_id', value);
    this._set('anonymous_id', value);
  }

  get user_id() {
    return this._props.user_id;
  }

  set user_id(value) {
    this._requireString('user_id', value);
    this._set('user_id', value);
  }

  get user_hash() {
    return this._props.user_hash;
  }

  set user_hash(value) {
    this._requireString('user_hash', value);
    this._set('user_hash', value);
  }

  get user_type() {
    return this._props.user_type;
  }

  set user_type(value) {
    this._requireString('user_type', value);
    this._set('user_type', value);
  }

  get site() {
    return this._props.site;
  }

  set site(value) {
    this._requireString('site', value);
    this._set('site', value);
  }

  get auth() {
    return this._props.auth;
  }

  set auth(value) {
    this._requireString('auth', value);
    this._set('auth', value);
  }

  // helpers //
  _set(key, value) {
    this._props[key] = value;
    this._plugin._events.emit('set', `${key} = '${value}'`);
  }

  _requireString(key, value) {
    if (typeof value !== 'string' && typeof value !== 'undefined') {
      throw new Error(`${key} must be a string`);
    }
    return value;
  }

}
