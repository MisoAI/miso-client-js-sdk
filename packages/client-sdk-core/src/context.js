import { Component } from '@miso.ai/commons';

export default class Context extends Component {

  constructor(client) {
    super('context', client);
    this._client = client;
  }

}
