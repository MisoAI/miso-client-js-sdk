import Helpers from './helpers';
import Interactions from './interactions';
import Recommendation from './recommendation';

export default class Api {

  constructor(context) {
    this._context = context;
    this.helpers = new Helpers(context);
    this.interactions = new Interactions(this);
    this.recommendation = new Recommendation(this);
  }

}
