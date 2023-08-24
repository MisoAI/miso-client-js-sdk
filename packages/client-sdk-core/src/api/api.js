import { Component } from '@miso.ai/commons';
import ApiHelpers from './helpers.js';
import Interactions from './interactions.js';
import Ask from './ask.js';
import Search from './search.js';
import Recommendation from './recommendation.js';

export default class Api extends Component {

  constructor(client, root) {
    super('api', client);
    this._client = client;
    this.helpers = new ApiHelpers(client, root);
    this.interactions = new Interactions(this);
    this.ask = new Ask(this);
    this.search = new Search(this);
    this.recommendation = new Recommendation(this);
  }

}
