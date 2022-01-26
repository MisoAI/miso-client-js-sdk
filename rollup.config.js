import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/miso.min.js',
      format: 'cjs',
      name: 'Miso',
      indent: false
    },
    plugins: [
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
