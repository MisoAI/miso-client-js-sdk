import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from'koa-bodyparser';

const app = new Koa();
const router = new Router();

router
  .post('/api/interactions', (ctx) => {
    ctx.body = {
      data: {}
    };
  })
  .post('/api/recommendation/user_to_products', (ctx) => {
    ctx.body = {
      data: []
    };
  });

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
