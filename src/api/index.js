import Helpers from './helpers';
import Interactions from './interactions';
import Search from './search';
import Recommendation from './recommendation';

export default class Api {

  constructor(context) {
    this._context = context;
    this.helpers = new Helpers(context);
    this.interactions = new Interactions(this);
    this.search = new Search(this);
    this.recommendation = new Recommendation(this);
  }

}
