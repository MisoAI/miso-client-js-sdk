import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from'koa-bodyparser';
import createRouter from './routes/index.mjs';
import Store from './store/index.mjs';
import Core from './core.mjs';

const store = new Store();
const core = new Core(store);
const router = createRouter(core);

const app = new Koa();

const handleUnrecognizedPath = (ctx) => {
  console.log(`Unrecognized Path: ${ctx.method} ${ctx.url}`);
}

app
  .use(cors())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(handleUnrecognizedPath)
  .listen(10102);
