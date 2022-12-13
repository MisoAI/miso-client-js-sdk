module.exports = (api) => {
  //api.cache(true);
  const ignore = api.env('test') ? [] : ['**/*.test.js'];
  return {
    env: {
      test: {
        plugins: ['@babel/plugin-transform-modules-commonjs']
      },
      cjs: {
        plugins: [
          '@babel/plugin-transform-modules-commonjs'
        ]
      }
    },
    ignore: ignore,
    presets: [
      [
        '@babel/preset-env', 
        {
          modules: false
        }
      ]
    ],
    plugins: [
      [
        '@babel/plugin-proposal-object-rest-spread',
        {
          loose: true,
          useBuiltIns: true,
        }
      ]
    ]
  };
}
