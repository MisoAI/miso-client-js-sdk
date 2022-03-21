import MisoClient from './client';
import cmd from './cmd';

if (!window.MisoClient) {
  window.MisoClient = MisoClient;
} else {
  // TODO: check version as well
  console.warn(`Use already defined window.MisoClient (${window.MisoClient.version}).`);
}

// kick off misocmd execution
cmd();

export default window.MisoClient;
