import { cmd as _cmd } from '@miso.ai/commons';

export default function cmd() {
  // kick off misodev execution
  _cmd('misodev');

  // do misocmd with setTimeout, so they will be executed after plugins are installed.
  setTimeout(() => _cmd('misocmd'));
}
