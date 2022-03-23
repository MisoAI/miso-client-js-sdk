# Miso SDK for JavaScript
Enhance your site with high conversion magic with [Miso's](https://miso.ai/) power.

<p>
  <a href="https://www.npmjs.com/package/@miso.ai/client-sdk"><img src="https://img.shields.io/npm/v/@miso.ai/client-sdk"></a>
  <a href="https://www.npmjs.com/package/@miso.ai/client-sdk"><img src="https://img.shields.io/bundlephobia/minzip/@miso.ai/client-sdk"></a>
  <a href="/LICENSE"><img src="https://img.shields.io/npm/l/@miso.ai/client-sdk"></a>
</p>

[Home](https://miso.ai/) |
[Docs](https://docs.miso.ai/) |
[SDK Reference](https://misoai.github.io/miso-client-js-sdk/) |
[API Reference](https://api.askmiso.com/) |
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
const MisoClient = require("@miso.ai/client-sdk");
const miso = new MisoClient("your-api-key");
```

Specify user ID optionally. Miso prevails even on fully anonymous data.
```js
// miso.context.user_id = "their-user-id";
```

Deliver fully personalized user experience of search, autocomplete,
```js
const { products } = await miso.search.search("...");
const { completions } = await miso.search.autocomplete("...");
```

and various kinds of recommendations:
```js
const { products } = await miso.recommendation.userToProducts();
const { products } = await miso.recommendation.productToProducts({ product_id: "..." });
```

Explore more opportunities with Miso's [recipes](https://docs.miso.ai/recipes).

<div align="center">
  <a href="https://miso.ai">
    <img src="../../asset/cta.svg" height="36px">
  </a>
</div>

## Development
See [Development](https://github.com/MisoAI/miso-client-js-sdk/blob/main/development.md).

## License
This library is distributed under the [MIT license](https://github.com/askmiso/miso-client-js-sdk/blob/main/LICENSE).
