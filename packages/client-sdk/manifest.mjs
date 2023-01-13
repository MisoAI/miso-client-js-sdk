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
    input: 'src/with-algolia.js',
    output: {
      filename: 'miso-algolia',
      format: 'umd',
      name: 'MisoClient',
      exports: 'default',
    },
  },
  {
    input: 'src/with-ui.js',
    output: {
      filename: 'miso-ui',
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
]; 
