import Router from '@koa/router';
import { products } from './handlers.mjs';

const router = new Router();

router.post('/user_to_products', products);
router.post('/product_to_products', products);

export default router;
