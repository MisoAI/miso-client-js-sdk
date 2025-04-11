function sdkUmdPath(env) {
  switch (env) {
    case 'prod':
    case 'production':
      return '//cdn.jsdelivr.net/npm/@miso.ai/client-sdk@latest/dist/umd';
    case 'beta':
      return '//cdn.jsdelivr.net/npm/@miso.ai/client-sdk@beta/dist/umd';
    case 'dev':
    case 'development':
    default:
      return '//localhost:10099/dist/umd';
  }
}

function sdkUmdFileExt(env) {
  switch (env) {
    case 'prod':
    case 'production':
    case 'beta':
      return '.min.js';
    case 'dev':
    case 'development':
    default:
      return '.js';
  }
}

function sdkUmdFileName(build) {
  switch (build) {
    case 'ui':
      return 'miso-ui';
    case 'algolia':
      return 'miso-algolia';
    case 'std':
    case 'standard':
    default:
      return 'miso';
  }
}

function sdkUrl(env, build) {
  return `${sdkUmdPath(env)}/${sdkUmdFileName(build)}${sdkUmdFileExt(env)}`;
}

export default function() {
  const env = process.env.NODE_ENV || 'production';
  return {
    env: env,
    sdk: {
      url: sdkUrl.bind(undefined, env)
    }
  };
}
