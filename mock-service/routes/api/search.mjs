import Router from '@koa/router';
import { respondSuccess } from './util.mjs';

// TODO: 4xx

// TODO
const search = core => async ctx => {
  const products = await core.store.catalog.getm();
  respondSuccess(core, ctx, {
    products,
    partially_matched_products: [],
    start: 0,
    total: 100,
    spellcheck: {
      spelling_errors: false
    }
  });
}

// TODO
const autocomplete = core => async ctx => {
  respondSuccess(core, ctx, {
    completions: {
      title: [],
      brand: []
    }
  });
}

// TODO: pass ids
const mget = core => async ctx => {
  const products = await core.store.catalog.getm();
  respondSuccess(core, ctx, {
    products
  });
}

export default function createRouter(core) {
  return new Router()
    .post('/search', search(core))
    .post('/autocomplete', autocomplete(core))
    .post('/mget', mget(core));
};
