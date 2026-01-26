import { Component, UserEngagementObserver, Stopwatch, trimObj, mergeInteractions } from '@miso.ai/commons';

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
      // TODO: merge with global options
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
    client.on('workflow', this._injectWorkflow.bind(this));
  }

  _injectWorkflow(workflow) {
    workflow.analytics = new Analytics(this, workflow);
  }

  _handleEngagement() {
    for (const member of this._members) {
      member._syncEngagementState();
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

  constructor(plugin, workflow) {
    this._plugin = plugin;
    plugin._members.push(this);
    this._workflow = workflow;
    this._timer = new Stopwatch();
    this._options = normalizeOptions();

    this._injectWorkflow(workflow);

    this._session = undefined;
    this._startAt = undefined;
    this._loadingAt = undefined;
    this._readyAt = undefined;

    this.config();
  }

  _injectWorkflow(workflow) {
    this._listenToLiftcycleEvents(workflow);
    this._injectProcessInteraction(workflow);
  }

  _listenToLiftcycleEvents(workflow) {
    workflow.on('session', this._handleSession.bind(this));
    workflow.on('loading', this._handleLoading.bind(this));
    workflow.on('ready', this._handleReady.bind(this));
  }

  _injectProcessInteraction(workflow) {
    // TODO: ad-hoc, find a way to provide plugin API in plugin root
    workflow._pluginContext.processInteractionPasses.push(this._writeStateToInteraction.bind(this));
  }

  _handleSession(session) {
    if (this._session && session.index === this._session.index) {
      return;
    }

    if (this._session) {
      // send a last heartbeat event for the old session
      this._sendHeartbeat();
    }

    this._session = session;
    this._timer.reset();
    this._startAt = Date.now();
    this._loadingAt = undefined;
    this._readyAt = undefined;
  }

  _handleLoading({ session } = {}) {
    this._loadingAt = Date.now();
  }

  _handleReady({ session } = {}) {
    this._readyAt = Date.now();
    // start timer if user is engaged
    this._syncEngagementState();
  }

  _sendHeartbeat() {
    const tracker = this._workflow.trackers.container;
    tracker && tracker.heartbeat();
  }

  _writeStateToInteraction(payload) {
    const { state } = this;
    return mergeInteractions(payload, {
      context: {
        custom_context: {
          analytics_timestamp: state.timestamp,
          user_engagement_time: state.userEngagementTime,
          user_idle_time: state.userIdleTime,
          user_waiting_time: state.userWaitingTime,
        },
      },
    });
  }

  config(options = {}) {
    this._options = mergeTwoOptions(this._options, normalizeOptions(options));
  }

  get options() {
    return {
      ...this._options,
    };
  }

  get state() {
    const currentTime = Date.now();
    const loadingAt = this._loadingAt;
    const readyAt = this._readyAt;
    let userEngagementTime = 0, userIdleTime = 0, userWaitingTime = 0;

    if (loadingAt !== undefined) {
      userWaitingTime = currentTime - loadingAt;
    }
    if (readyAt !== undefined) {
      userWaitingTime = readyAt - loadingAt;
      userEngagementTime = this._timer.getDuration(currentTime);
      userIdleTime = currentTime - readyAt - userEngagementTime;
    }

    return trimObj({
      timestamp: currentTime,
      userWaitingTime,
      userEngagementTime,
      userIdleTime,
    });
  }

  _syncEngagementState() {
    const shallStart = this._plugin._engagement.engaged;
    if (shallStart) {
      this._timer.start();
    } else {
      this._timer.stop();
    }
  }

}
