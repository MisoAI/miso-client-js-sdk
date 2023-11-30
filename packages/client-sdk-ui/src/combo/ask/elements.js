import { defineValues } from '@miso.ai/commons';
import { constants } from '../../defaults/ask/index.js';

export default class AskComboElements {

  constructor(root, { classPrefix = constants.CLASS_PREFIX } = {}) {
    if (!root) {
      throw new Error('Root element is required');
    }
    defineValues(this, {
      root,
      followUpsSection: root.querySelector(`.${classPrefix}__follow-ups`),
      relatedResourcesContainer: root.querySelector(`.${classPrefix}__related-resources miso-ask`),
    });
  }

}
