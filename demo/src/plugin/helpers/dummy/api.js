import { products } from './products';

export function user_to_products({
  rows = 5,
} = {}) {
  return async () => ({
    products: [...products({ rows })],
  });
}
