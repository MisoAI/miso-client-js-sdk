import Router from '@koa/router';
import { respondSuccess } from './util.mjs';

// TODO: 4xx

const user_to_products = core => async ctx => {
  const products = await core.store.catalog.getm();
  respondSuccess(core, ctx, {
    products
  });
}

// TODO
const user_to_categories = core => async ctx => {
  respondSuccess(core, ctx, {
    categories: []
  });
}

// TODO
const user_to_attributes = core => async ctx => {
  respondSuccess(core, ctx, {
    attributes: []
  });
}

const user_to_trending = core => async ctx => {
  const products = await core.store.catalog.getm();
  respondSuccess(core, ctx, {
    products
  });
}

const product_to_products = core => async ctx => {
  const products = await core.store.catalog.getm();
  respondSuccess(core, ctx, {
    products
  });
}

export default function createRouter(core) {
  return new Router()
    .post('/user_to_products', user_to_products(core))
    .post('/user_to_categories', user_to_categories(core))
    .post('/user_to_attributes', user_to_attributes(core))
    .post('/user_to_trending', user_to_trending(core))
    .post('/product_to_products', product_to_products(core));
};
