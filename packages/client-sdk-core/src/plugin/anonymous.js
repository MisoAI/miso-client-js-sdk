import { defineValues } from '@miso.ai/commons';

export default class AnonymousPlugin {

  constructor(install) {
    defineValues(this, { install });
  }

}
