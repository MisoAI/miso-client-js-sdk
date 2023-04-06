import Router from '@koa/router';
import search from './search.mjs';
import recommendation from './recommendation.mjs';

const router = new Router();

router.use('/recommendation', recommendation.routes(), recommendation.allowedMethods());
router.use('/search', search.routes(), search.allowedMethods());

export default router;
