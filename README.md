<div align="center">
  <div>
    <a href="https://miso.ai" target="_blank">
      <img src=".github/img/logo.svg" width="160px">
    </a>
  </div>
  <p>
    <strong>Private AI for the Open Web.</strong>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/@miso.ai/client-sdk" target="_blank"><img src="https://img.shields.io/npm/v/@miso.ai/client-sdk"></a>
    <a href="https://www.npmjs.com/package/@miso.ai/client-sdk" target="_blank"><img src="https://img.shields.io/bundlephobia/minzip/@miso.ai/client-sdk"></a>
    <a href="/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@miso.ai/client-sdk"></a>
  </p>
  <a href="https://miso.ai/" target="_blank">Home</a> | <a href="https://answers.miso.ai/" target="_blank">Demo</a> | <a href="https://docs.miso.ai/" target="_blank">Docs</a> | <a href="https://misoai.github.io/miso-client-js-sdk/answers" target="_blank">SDK Reference</a> | <a href="https://api.askmiso.com/" target="_blank">API Reference</a>
</div>

----

With LLM technology today, your users want to engage your content in smarter ways in place of the traditional keyword search. Miso offers LLM answer API services with our private models and your controlled content source.

https://github.com/MisoAI/miso-client-js-sdk/assets/785058/2255a32f-37e4-456b-bc4c-ec908cdc3c93

### Why Miso

- Citation-driven, i.e. no AI hallucinations
- Your own AI answer engine tuned to your content
- Designed to comply with your content guidelines

# Miso JavaScript SDK

Miso provides a JavaScript SDK for browser that gives you the power to integrate the full Miso Answers solution to your website in 10 minutes.

<div align="center">
  <a href="https://misoai.github.io/miso-client-js-sdk/demo/latest/answers/ask/" target="_blank">
    <img src=".github/img/demo.svg" width="160px">
  </a>
</div>

## Quick start

1. Log in Miso [dashboard](https://dojo.askmiso.com/) to obtain your publishable API key.
2. Add the SDK and element to your website.

```html
<head>
  <script async src="https://cdn.jsdelivr.net/npm/@miso.ai/client-sdk@latest/dist/umd/miso.min.js?api_key={{api_key}}"></script>
</head>
<body>
  ...
  <miso-ask-combo></miso-ask-combo>
  ...
</body>
```

<div align="center">
  <a href="https://stackblitz.com/github/MisoAI/miso-sdk-docs/tree/main/examples/client/1.9/answers/ask/standard/basic" target="_blank">
    <img src=".github/img/live-demo.svg" height="48px">
  </a>
</div>

## Other SDKs
* [Node.js SDK](https://misoai.github.io/miso-server-js-sdk/sdk/)
* [Python SDK](https://misoai.github.io/miso-python-sdk/)

## Development
See [Development](./development.md).

## License
This library is distributed under the [MIT license](https://github.com/askmiso/miso-client-js-sdk/blob/main/LICENSE).
