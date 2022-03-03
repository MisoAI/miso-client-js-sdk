# Miso SDK for JavaScript
Enhance your site with high conversion magic with [Miso's](https://miso.ai/) power.

<p>
  <a href="https://www.npmjs.com/package/@miso.ai/client-sdk"><img src="https://img.shields.io/npm/v/@miso.ai/client-sdk"></a>
  <a href="https://www.npmjs.com/package/@miso.ai/client-sdk"><img src="https://img.shields.io/bundlephobia/minzip/@miso.ai/client-sdk"></a>
  <a href="/LICENSE"><img src="https://img.shields.io/npm/l/@miso.ai/client-sdk"></a>
</p>

[Home](https://miso.ai/) |
[Docs](https://docs.miso.ai/) |
[REST API](https://api.askmiso.com/) |
[Recipes](https://docs.miso.ai/recipes)

## Highlights
* Lightweight, mobile friendly.
* Simple, easy to integrate.
* Bundled in UMD format. Can be loaded as a CJS/AMD module or by a script tag.
* For browser. Server-side SDK coming up later.

## Quick Start
Install the dependency:
```bash
npm install @miso.ai/client-sdk
```

Create Miso client:
```js
const createMiso = require("@miso.ai/client-sdk");
const miso = createMiso("your-api-key");
```

Specify an anonymous or signed-in user id:
```js
miso.context.setAnonymousId("an-anonymous-id");
miso.context.setUserId("the-user-id");
```

Deliver fully personalized user experience of search, autocomplete,
```js
const { products } = await miso.search.search("...");
const { completions } = await miso.search.autocomplete("...");
```

and various kinds of recommendations:
```js
const { products } = await miso.recommendation.user_to_products();
const { products } = await miso.recommendation.product_to_products({ product_id: "..." });
```

Explore more opportunities with Miso's [recipes](https://docs.miso.ai/recipes).

<div align="center">
  <a href="https://miso.ai">
    <img src="asset/cta.svg" height="45px">
  </a>
</div>

## Development
See [Development](./development.md).

## License
This library is distributed under the [MIT license](https://github.com/askmiso/miso-client-js-sdk/blob/main/LICENSE).
