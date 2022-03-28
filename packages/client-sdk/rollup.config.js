import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import replace from '@rollup/plugin-replace';
import { version } from './package.json';

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/umd/miso.min.js',
      format: 'umd',
      name: 'MisoClient',
      exports: 'default',
      indent: false
    },
    plugins: [
      commonjs(),
      replace({
        preventAssignment: true,
        values: {
          __version__: JSON.stringify(version || process.env.GIT_HASH)
        }
      }),
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
  },
];
