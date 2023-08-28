export default {
  env: {
    cjs: {
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
      ],
    },
  },
  presets: [
    [
      '@babel/preset-env', 
      {
        modules: false,
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-proposal-object-rest-spread',
      {
        loose: true,
        useBuiltIns: true,
      },
    ],
    '@babel/plugin-transform-export-namespace-from',
  ],
};
