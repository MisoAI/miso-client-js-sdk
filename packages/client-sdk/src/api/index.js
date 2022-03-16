import Helpers from './helpers';
import Interactions from './interactions';
import Search from './search';
import Recommendation from './recommendation';

export default class Api {

  constructor(client) {
    this._client = client;
    this.helpers = new Helpers(client);
    this.interactions = new Interactions(this);
    this.search = new Search(this);
    this.recommendation = new Recommendation(this);
  }

}
