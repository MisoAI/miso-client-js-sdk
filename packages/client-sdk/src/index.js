import { setCmdDone } from '@miso.ai/client-sdk-core';
import MisoClient from './detached/index.js';
import cmd from './cmd.js';

MisoClient.attach();

cmd(setCmdDone);

export default MisoClient;
