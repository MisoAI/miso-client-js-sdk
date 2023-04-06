import Router from '@koa/router';
import { products } from '../util/index.mjs';

const router = new Router();

router.post('/user_to_products', (ctx) => {
  const { rows = 5 } = JSON.parse(ctx.request.body);
  ctx.body = {
    data: {
      products: [...products({ rows })],
    },
  };
});

export default router;
