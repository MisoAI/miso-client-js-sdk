import { removeArrayItem } from '../util/objects';
import Plugin from './base';

const TAG = '%cMiso';
const STYLE = 'color: #fff; background-color: #334cbb; padding: 2px 2px 1px 4px;';

export default class Debug extends Plugin {

  constructor() {
    super('debug');
    this._log = this._log.bind(this);
  }

  _install(client) {
    const debuggers = client._debuggers || (client._debuggers = []);
    debuggers.push(this._log);
  }

  _log(name) {
    const data = Array.prototype.slice.call(arguments, 1);
    const args = [TAG, STYLE, name].concat(data);
    console.log.apply(console, args);
  }

  _uninstall(client) {
    client._debuggers && removeArrayItem(client._debuggers, this._log);
  }

}
