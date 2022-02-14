import { trimObj } from './objects';

export default function createConfig(normalize) {
  if (normalize !== undefined && typeof normalize !== 'function') {
    throw new Error('normalize must be a function or undefined.');
  }
  normalize = normalize || (v => v);
  let _values = {};
  const config = (values) => {
    trimObj(Object.assign(_values, normalize(values)));
  };
  const readonly = {};
  Object.defineProperty(readonly, 'values', {
    get: () => config.values
  });
  Object.defineProperties(config, {
    values: {
      get: () => Object.assign({}, _values)
    },
    clear: {
      get: () => {
        _values = {};
        return config;
      }
    },
    readonly: {
      value: readonly
    },
  });
  return config;
}
