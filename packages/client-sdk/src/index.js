import MisoClient from './detached/index.js';
import cmd from './cmd.js';

MisoClient.attach();

cmd();

export default MisoClient;
