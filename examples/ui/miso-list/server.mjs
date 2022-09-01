import 'dotenv/config';
import Koa from 'koa';
import serve from 'koa-static';

function asNumber(value) {
  value = value !== undefined && value !== null ? Number(value) : undefined;
  return value !== undefined && !isNaN(value) ? value : undefined;
}

const port = asNumber(process.env.PORT) || 5000;

console.log(`Serving app at http://localhost:${port}`);

new Koa()
  .use(serve('.'))
  .use(serve('dist'))
  .listen(port);
