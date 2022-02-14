import Router from '@koa/router';
import api from './api/index.mjs';

export default function createRouter(core) {
  return new Router()
    .use('/api', api(core).routes());
};
