import Router from '@koa/router';
import { products } from './handlers.mjs';

const router = new Router();

router.post('/search', products);

export default router;
