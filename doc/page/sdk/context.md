---
layout: base.njk
title: Context Variables
---

This is a quality-of-life module. You can save some shared variables with context API, so they will be passed into other API calls automatically.

### Anonymous ID

The SDK takes care of `anonymous_id` automatically using session storage. It will be managed and passed into API calls automatically.

You can also set `anonymous_id` by yourself:

```js
miso.context.anonymous_id = 'my_anonymous_id';
```

### User ID and hash
Set `user_id` and `user_hash`:

```js
miso.context.user_id = 'user_id';
miso.context.user_hash = 'user_hash';
```

See [REST API](https://api.askmiso.com/#operation/search_v1_search_search_post) for more details about `user_hash`.
