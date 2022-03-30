import { defineValues } from '@miso.ai/commons';

export default class SimplePlugin {

  constructor(name, install) {
    defineValues(this, { name, install });
  }

}
