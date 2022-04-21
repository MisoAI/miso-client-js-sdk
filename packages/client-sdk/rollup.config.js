import deepmerge from 'deepmerge';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';

const config = {
  output: {
    format: 'umd',
    name: 'MisoClient',
    exports: 'default',
    indent: false
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    babel({
      babelHelpers: 'bundled'
    }),
    terser({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      },
    }),
    filesize({
      showMinifiedSize: false,
      showGzippedSize: true,
    }),
  ],
};

const builds = [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/umd/miso.min.js',
    },
  },
  {
    input: 'src/with-ui.js',
    output: {
      file: 'dist/umd/miso-with-ui.min.js',
    },
  },
];

export default builds.map((v) => deepmerge(config, v));
