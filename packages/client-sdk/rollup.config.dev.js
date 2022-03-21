import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/miso.js',
    format: 'umd',
    name: 'MisoClient',
    exports: 'default',
    indent: true
  },
  watch: true,
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __version__: JSON.stringify('dev')
      }
    }),
    nodeResolve(),
    serve({
      port: 10101,
    }),
    livereload({
      delay: 500,
      watch: 'dist',
    }),
  ],
};
