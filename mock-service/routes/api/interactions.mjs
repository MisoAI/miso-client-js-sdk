import Router from '@koa/router';

// TODO: 4xx

const upload = core => async ctx => {
  ctx.body = {
    took: 5,
    errors: false,
    data: []
  };
}

export default function createRouter(core) {
  return new Router()
    .post('/', upload(core));
};
