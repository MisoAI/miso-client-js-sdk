import MisoClient from './detached/lite';
import cmd from './cmd';

MisoClient.attach();

cmd();

export default MisoClient;
