import Router from '@koa/router';
import interactions from './interactions.mjs';
import search from './search.mjs';
import recommendation from './recommendation.mjs';
import qa from './qa.mjs';

export default function createRouter(core) {
  return new Router()
    .use('/interactions', interactions(core).routes())
    .use('/search', search(core).routes())
    .use('/recommendation', recommendation(core).routes())
    .use('/qa', qa(core).routes());
};
