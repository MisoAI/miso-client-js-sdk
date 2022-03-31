import init from './init';
import cmd from './cmd';

// TODO: full and lite (w/o UI) builds

if (!window.MisoClient) {
  // gaurantee to execute init() only once globally (across different script sources)
  window.MisoClient = init();
  // kick off misocmd execution
  cmd();

} else {
  // TODO: check version as well
  console.warn(`Use already defined window.MisoClient (${window.MisoClient.version}).`);
}

export default window.MisoClient;
