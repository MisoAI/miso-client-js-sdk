import { join } from 'path';
import 'dotenv/config';
import glob from 'fast-glob';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const cwd = join(__dirname, 'src/entry');
export const entries = glob.sync('*.js', { cwd }).map(s => s.substring(0, s.length - 3));

function _config(name, env = 'prod') {
  const prod = env === 'prod';
  let plugins = [
    commonjs(),
    nodeResolve(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
      __DEFAULT_API_KEY__: JSON.stringify(process.env.DEFAULT_API_KEY),
    }),
    babel({
      babelHelpers: 'bundled'
    }),
  ];
  if (prod) {
    plugins = [
      ...plugins,
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        },
      }),
    ];
  }
  return {
    input: `src/entry/${name}.js`,
    output: {
      file: `dist/js/${name}.js`,
      format: 'umd',
      indent: !prod,
    },
    watch: !prod,
    plugins,
  };
}

export function config(prod) {
  return entries.map(name => _config(name, prod));
}
