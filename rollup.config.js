import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default [
  // UMD
  {
    input: 'src/index.js',
    output: {
      file: 'dist/miso.min.js',
      format: 'umd',
      name: 'Miso',
      indent: false
    },
    plugins: [
      nodeResolve(),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        },
      }),
    ],
  },
];
