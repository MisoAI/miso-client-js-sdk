import MisoClient from './client';
import { init } from './root';
import cmd from './cmd';

if (!window.MisoClient) {
  // gaurantee to execute init() only once globally (across different script sources)
  window.MisoClient = init(MisoClient);

  // kick off misodev execution
  cmd('misodev');

  // do misocmd with setTimeout, so they will be executed after plugins are installed.
  setTimeout(() => cmd('misocmd'));

} else {
  // TODO: check version as well
  console.warn(`Use already defined window.MisoClient (${window.MisoClient.version}).`);
}

export default window.MisoClient;
