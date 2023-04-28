import Router from '@koa/router';
import answers from './answers.mjs';
import recommendation from './recommendation.mjs';
import search from './search.mjs';

const router = new Router();

router.use('/search', search.routes(), search.allowedMethods());
router.use('/recommendation', recommendation.routes(), recommendation.allowedMethods());
router.use('/answers', answers.routes(), answers.allowedMethods());

router.post('/interactions', (ctx) => {
  ctx.body = { took: 1, errors: false, data: [] };
});

export default router;
