import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import manifest from './manifest.mjs';

function _config({ input, output: { filename: outputFilename, ...output } }, env = 'prod') {
  const prod = env === 'prod';
  let plugins = [
    commonjs(),
    nodeResolve(),
    nodePolyfills(),
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
    input,
    output: {
      file: prod ? `dist/umd/${outputFilename}.min.js` : `dist/umd/${outputFilename}.js`,
      ...output,
      indent: !prod,
    },
    watch: !prod,
    plugins,
  };
}

export function config(prod) {
  return manifest.map(entry => _config(entry, prod));
}
