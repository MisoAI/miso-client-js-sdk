import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import replace from '@rollup/plugin-replace';
import { version } from './package.json';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/miso.js',
    format: 'cjs',
    name: 'Miso',
    indent: true
  },
  watch: true,
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __version__: JSON.stringify(version)
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
