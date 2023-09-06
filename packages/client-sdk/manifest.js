export default [
  {
    input: 'src/index.js',
    output: {
      filename: 'miso',
      format: 'umd',
      name: 'MisoClient',
      exports: 'default',
    },
  },
  {
    input: 'src/lite.js',
    output: {
      filename: 'miso-lite',
      format: 'umd',
      name: 'MisoClient',
      exports: 'default',
    },
  },
  {
    input: 'src/shopify.js',
    output: {
      filename: 'miso-shopify',
      format: 'iife',
    },
  },
  {
    input: 'src/plugins/ui-markdown.js',
    output: {
      filename: 'plugins/ui-markdown',
      format: 'iife',
    },
  },
  {
    input: 'src/plugins/algolia.js',
    output: {
      filename: 'plugins/algolia',
      format: 'iife',
    },
  },
  {
    input: 'src/plugins/lorem.js',
    output: {
      filename: 'plugins/lorem',
      format: 'iife',
    },
  },
]; 
