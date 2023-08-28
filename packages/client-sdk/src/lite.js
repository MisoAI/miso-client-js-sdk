import MisoClient from './detached/lite.js';
import cmd from './cmd.js';

MisoClient.attach();

cmd();

export default MisoClient;
