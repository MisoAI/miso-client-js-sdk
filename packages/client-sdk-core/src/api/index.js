import { Component } from '@miso.ai/commons';
import ApiHelpers from './helpers';
import Interactions from './interactions';
import Ask from './ask';
import Search from './search';
import Recommendation from './recommendation';

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
