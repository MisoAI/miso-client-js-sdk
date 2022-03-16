import MisoClient from './client';

// export { default as getContext } from './context';

export default function createMiso(options) {
  return new MisoClient(options);
};
