import { EventEmitter } from '@miso.ai/commons';

export default class WorkflowEventBus {

  constructor() {
    this._defaultHandlers = {};
    const events = this._events = new EventEmitter();
    const run = events._run;
    const self = this;
    events._run = function(event) {
      try {
        run.call(this, event);
      } catch (_) {}
      self._runDefaultHandlers(event);
    }
  }

  _runDefaultHandlers(event) {
    const { data, meta } = event;
    const { name } = meta;
    const handlers = this._defaultHandlers[name] || [];
    for (const handler of handlers) {
      try {
        handler(data, meta);
      } catch (_) {}
    }
  }

  createView(workflow) {
    return new WorkflowEventBusView(this, workflow);
  }

  on(workflowName, eventName, callback) {
    return this._events.on(composeEventName(workflowName, eventName), callback);
  }

  handle(workflowName, eventName, callback) {
    const name = composeEventName(workflowName, eventName);
    const handlers = this._defaultHandlers[name] || (this._defaultHandlers[name] = []);
    handlers.push(callback);
    return () => {
      handlers.splice(handlers.indexOf(callback), 1);
    };
  }

}

class WorkflowEventBusView {

  constructor(bus, workflow) {
    this._bus = bus;
    this._workflow = workflow;
  }

  on(workflowName, eventName, callback) {
    return this._bus.on(workflowName, eventName, callback);
  }

  handle(workflowName, eventName, callback) {
    return this._bus.handle(workflowName, eventName, callback);
  }

  emit(eventName, data, meta) {
    const workflow = this._workflow;
    const name = composeEventName(workflow._name, eventName);
    return this._bus._events.emit(name, data, { ...meta, workflow });
  }

}

function composeEventName(workflowName, eventName) {
  return `${workflowName}:${eventName}`;
}
