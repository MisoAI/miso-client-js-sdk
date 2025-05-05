import Sessions from './sessions.js';

export default class Workflows {

  constructor(miso) {
    this._miso = miso;
    this._workflows = [];
  }

  get(ref) {
    if (!ref) {
      throw new Error('Workflow name/uuid is required');
    }
    for (const workflow of this._workflows) {
      if (workflow.name === ref || workflow.uuid === ref) {
        return workflow;
      }
    }
    throw new Error(`Workflow "${ref}" is not found`);
  }

  [Symbol.iterator]() {
    return this._workflows[Symbol.iterator]();
  }

  _handleEvent(event) {
    if (event._event === 'workflow') {
      // TODO: make sure not redundant
      this._workflows.push(new Workflow(this, event));
      return true;
    }
    if (event._workflow) {
      const { uuid } = event._workflow;
      const workflow = this.get(uuid);
      if (!workflow) {
        if (this._miso._options.verifyEvents) {
          throw new Error(`Workflow "${uuid}" is not found in event ${JSON.stringify(event)}`);
        }
        return false;
      }
      return workflow._handleEvent(event);
    }
    return false;
  }

}

class Workflow {

  constructor(workflows, data) {
    this._miso = workflows._miso;
    this._workflows = workflows;
    Object.assign(this, data);
    this._sessions = new Sessions(this);
  }

  _handleEvent(event) {
    return this._sessions._handleEvent(event) || this._handleUnknownEvent(event);
  }

  _handleUnknownEvent(event) {
    // TODO: only when verbose
    console.log('Unknown event (workflow)', event);
    return true;
  }

}
