import { defineValues } from '../util/objects';

export default class SimplePlugin {

  constructor(name, install) {
    defineValues(this, { name, install });
  }

}
