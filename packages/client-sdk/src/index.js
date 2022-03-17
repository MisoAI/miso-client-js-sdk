import MisoClient from './client';

createMiso.MisoClient = MisoClient;

export default function createMiso(options) {
  return new MisoClient(options);
};
