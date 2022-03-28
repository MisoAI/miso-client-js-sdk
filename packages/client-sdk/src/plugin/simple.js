import { defineValues } from '@miso.ai/commons/dist/es/objects';

export default class SimplePlugin {

  constructor(name, install) {
    defineValues(this, { name, install });
  }

}
