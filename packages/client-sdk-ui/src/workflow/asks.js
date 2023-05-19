import Ask from './ask';

export default class Asks {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;
    this._members = [];
    new Ask(this, 0); // initialize with one workflow
  }

  get count() {
    return this._members.length;
  }
  
  get root() {
    return this.get(0);
  }

  get last() {
    return this.get(this.count - 1);
  }

  get(index = 0) {
    return this._members[index];
  }

  _push(ask) {
    this._members.push(ask);
    // TODO: move containers with index="last" to the new one
  }

}
