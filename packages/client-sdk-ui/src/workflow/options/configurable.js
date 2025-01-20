import { WORKFLOW_CONFIGURABLE } from '../../constants.js';

const DEFAULT_FEATURES = [
  WORKFLOW_CONFIGURABLE.API,
  WORKFLOW_CONFIGURABLE.LAYOUTS,
  WORKFLOW_CONFIGURABLE.DATA_PROCESSOR,
  WORKFLOW_CONFIGURABLE.TRACKERS,
  WORKFLOW_CONFIGURABLE.INTERACTIONS,
];

export function makeConfigurable(prototype, features = DEFAULT_FEATURES) {
  for (const feature of features) {
    injectConfigurableFeature(prototype, feature);
  }
}

function injectConfigurableFeature(prototype, feature) {
  if (feature === 'api') {
    Object.assign(prototype, {
      useApi(...args) {
        this._options.api.merge(args);
        return this;
      },
      clearApi() {
        this._options.api.set();
        return this;
      },
    });
  } else {
    const upperCased = upperCase(feature);
    Object.assign(prototype, {
      [`use${upperCased}`](value) {
        (this._options[feature]).merge(value);
        return this;
      },
      [`clear${upperCased}`]() {
        (this._options[feature]).set();
        return this;
      },
    });
  }
}

// helpers //
function upperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
