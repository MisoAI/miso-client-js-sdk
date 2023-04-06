import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import { koaBody } from 'koa-body';

import api from './api/index.mjs';

const app = new Koa();
const router = new Router();

router.use('/api', api.routes(), api.allowedMethods());

app
  .use(cors())
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(9901);
