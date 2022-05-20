import { join } from 'path';
import glob from 'fast-glob';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const cwd = join(__dirname, 'src');
export const entries = glob.sync('*.js', { cwd }).map(s => s.substring(0, s.length - 3));

function _config(name, env = 'prod') {
  const prod = env === 'prod';
  let plugins = [
    commonjs(),
    nodeResolve(),
  ];
  if (prod) {
    plugins = [
      ...plugins,
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
    ];
  } else {
    plugins = [
      ...plugins,
      serve({
        port: 10099,
      }),
      livereload({
        delay: 500,
        watch: 'dist',
      }),
    ];
  }
  return {
    input: `src/${name}.js`,
    output: {
      file: prod ? `dist/umd/${getOutputFileName(name)}.min.js` : `dist/umd/${getOutputFileName(name)}.js`,
      format: 'umd',
      name: 'MisoClient',
      exports: 'default',
      indent: !prod,
    },
    watch: !prod,
    plugins,
  };
}

function getOutputFileName(name) {
  return name === 'index' ? `miso` : `miso-${name}`;
}

export function config(prod) {
  return entries.map(name => _config(name, prod));
}
