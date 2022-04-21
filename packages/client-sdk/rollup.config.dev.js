import deepmerge from 'deepmerge';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const config = {
  output: {
    format: 'umd',
    name: 'MisoClient',
    exports: 'default',
    indent: true
  },
  watch: true,
  plugins: [
    commonjs(),
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

const builds = [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/umd/miso.js',
    },
  },
  {
    input: 'src/with-ui.js',
    output: {
      file: 'dist/umd/miso-with-ui.js',
    },
  },
];

export default builds.map((v) => deepmerge(config, v));
