import 'dotenv/config';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import dev from 'rollup-plugin-dev'
import livereload from 'rollup-plugin-livereload';

const watchMode = process.env.ROLLUP_WATCH;

const plugins = [
  commonjs(),
  nodeResolve(),
  replace({
    preventAssignment: true,
    __MISO_API_KEY__: process.env.MISO_API_KEY ? JSON.stringify(process.env.MISO_API_KEY) : undefined,
  }),
  babel({
    babelHelpers: 'bundled'
  }),
  dev({
    dirs: [
      'dist',
      'static',
    ],
    port: asNumber(process.env.PORT) || 10099,
    spa: true,
    force: true,
  }),
];

if (watchMode) {
  plugins.push(
    livereload({
      delay: 500,
      watch: 'dist',
    }),
  );
}

function asNumber(value) {
  value = value !== undefined && value !== null ? Number(value) : undefined;
  return value !== undefined && !isNaN(value) ? value : undefined;
}

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/js/index.js',
    format: 'umd',
    indent: true,
  },
  watch: true,
  plugins,
};
