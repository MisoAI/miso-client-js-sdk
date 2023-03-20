import * as u from './utils';
import * as lorem from './lorem';

export function *products({ rows, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield product({ ...options, index: i });
  }
}

function product({} = {}) {
  const id = u.id();
  const prices = u.repeat(u.price, 1, 2);
  prices.sort();
  const seed = Math.floor(Math.random() * 1000);

  return {
    product_id: id,
    authors: lorem.lorem({
      min: 1,
      max: 3,
      fixedStarts: 0,
      decorates: ['title'],
      output: 'array',
    }),
    categories: [],
    tags: lorem.lorem({
      min: 1,
      max: 4,
      fixedStarts: 0,
      output: 'array',
    }),
    title: lorem.lorem({
      min: 2,
      max: 6,
      fixedStarts: 0,
      decorates: ['title'],
    }),
    description: lorem.lorem({
      min: 10,
      max: 20,
      decorates: ['description'],
    }),
    //html,
    cover_image: `https://picsum.photos/seed/${seed}/300`,
    url: `/products/${id}`,
    sale_price: prices[0],
    original_price: prices[prices.length - 1],
    rating: u.rating(),
    availability: u.availability(),
  };
}
