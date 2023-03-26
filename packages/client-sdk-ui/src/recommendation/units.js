import { delegateGetters } from '@miso.ai/commons';
import { DEFAULT_UNIT_ID } from '../constants';
import RecommendationUnit from './unit';
import Interactions from '../interactions';

export default class UnitsContext {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;
    this._units = new Map();
    this.interactions = new Interactions(this);
    this.interface = new Recommendation(this);
  }

  units() {
    return [...this._units.values()];
  }

  create(unitId = DEFAULT_UNIT_ID) {
    if (this._units.has(unitId)) {
      throw new Error(`Unit already exists: ${unitId}`);
    }
    return new RecommendationUnit(this, unitId);
  }

  has(unitId = DEFAULT_UNIT_ID) {
    return this._units.has(unitId);
  }

  get(unitId = DEFAULT_UNIT_ID) {
    if (typeof unitId !== 'string') {
      throw new Error(`Required unit ID to be a string: ${unitId}`);
    }
    return this._units.get(unitId) || new RecommendationUnit(this, unitId);
  }

}

class Recommendation {

  constructor(context) {
    delegateGetters(this, context, ['units', 'has', 'create', 'get', 'interactions']);
  }

}
