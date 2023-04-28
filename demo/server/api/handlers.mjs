import { products as _products } from '../util/index.mjs';

export function products(ctx) {
  const { rows = 5 } = ctx.request.body;
  ctx.body = {
    data: {
      products: [..._products({ rows })],
    },
  };
}
