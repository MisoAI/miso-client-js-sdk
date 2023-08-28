import { Component } from '@miso.ai/commons';
import Ask from './ask.js';

export default class Asks extends Component {

  constructor(plugin, client) {
    super('asks', plugin);
    this._plugin = plugin;
    this._client = client;
    this._byQid = new Map();
    this._byPqid = new Map();
    this._root = new Ask(this); // initialize with default workflow
  }

  get root() {
    return this._root;
  }

  get workflows() {
    return [this._root, ...this._byPqid.values()];
  }

  getByQuestionId(questionId) {
    if (typeof questionId !== 'string') {
      throw new Error(`Required ID to be a string: ${questionId}`);
    }
    return this._byQid.get(questionId);
  }

  getByParentQuestionId(parentQuestionId, { autoCreate = false } = {}) {
    if (parentQuestionId === undefined) {
      return this._root;
    }
    if (typeof parentQuestionId !== 'string') {
      throw new Error(`Required ID to be a string: ${parentQuestionId}`);
    }
    let workflow = this._byPqid.get(parentQuestionId);
    if (!workflow && autoCreate) {
      workflow = new Ask(this, parentQuestionId);
    }
    return workflow;
  }

}
