import { Component, UserEngagementObserver, Stopwatch } from '@miso.ai/commons';

const PLUGIN_ID = 'std:analytics';

export default class AnalyticsPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('analytics');
    this._members = [];
    this._engagement = undefined;
  }

  config(options = {}) {
    this._options = options;
    for (const member of this._members) {
      // notify update
      //member.config(options);
    }
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    this._engagement = new UserEngagementObserver(this._handleEngagement.bind(this));
    // TODO: should we provide a way to stop the observer? 
    MisoClient.on('create', this._injectClient.bind(this));
  }

  _injectClient(client) {
    client.analytics = new Analytics(this, client);
  }

  _handleEngagement() {
    for (const member of this._members) {
      member._syncTimerState();
    }
  }

}

function normalizeOptions({ ...options } = {}) {
  return {
    ...options,
  };
}

function mergeTwoOptions(base, overrides) {
  return {
    ...base,
    ...overrides,
  };
}

class Analytics {

  constructor(plugin, client) {
    this._plugin = plugin;
    plugin._members.push(this);
    this._client = client;
    this._timer = new Stopwatch();
    this._options = normalizeOptions();
    this._active = false;
    this._startTime = undefined
    this.config();
  }

  config(options = {}) {
    this._options = mergeTwoOptions(this._options, normalizeOptions(options));
  }

  get options() {
    return {
      ...this._options,
    };
  }

  get active() {
    return this._active;
  }

  start() {
    if (this._active) {
      return;
    }
    this._active = true;
    this._startTime = Date.now();
    this._syncTimerState();
  }

  stop() {
    if (!this._active) {
      return;
    }
    this._active = false;
    this._syncTimerState();
  }

  get state() {
    const currentTime = Date.now();
    const startTime = this._startTime;
    const elaspsedTime = currentTime - startTime;
    const userEngagementTime = this._timer.getDuration(currentTime);
    const userIdleTime = elaspsedTime - userEngagementTime;
    return {
      currentTime,
      startTime,
      elaspsedTime,
      userEngagementTime,
      userIdleTime,
    };
  }

  _syncTimerState() {
    const shallStart = this._active && this._plugin._engagement.engaged;
    if (shallStart) {
      this._timer.start();
    } else {
      this._timer.stop();
    }
  }

}
