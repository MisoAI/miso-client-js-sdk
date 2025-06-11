import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import glob from 'fast-glob';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import yaml from '@rollup/plugin-yaml';
import vue from '@vitejs/plugin-vue';
import styles from 'rollup-plugin-styles';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = join(__dirname, 'src/entry');
export const entries = glob.sync('*.js', { cwd }).map(s => s.substring(0, s.length - 3)).filter(s => !s.startsWith('_'));

function _config(name, env = 'prod') {
  const prod = env === 'prod';
  let plugins = [
    vue({
      include: /\.vue$/,
      template: {
        compilerOptions: {
          whitespace: 'condense',
        },
      },
    }),
    commonjs(),
    nodeResolve({ 
      browser: true,
      extensions: ['.js', '.vue'],
      dedupe: ['vue'],
    }),
    yaml(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __DEFAULT_API_KEY__: JSON.stringify(process.env.DEFAULT_API_KEY),
      __DEFAULT_ASK_API_KEY__: JSON.stringify(process.env.DEFAULT_ASK_API_KEY),
      __DEFAULT_AFFILIATION_ASK_API_KEY__: JSON.stringify(process.env.DEFAULT_AFFILIATION_ASK_API_KEY),
      __DEFAULT_USER_ID__: JSON.stringify(process.env.DEFAULT_USER_ID),
    }),
    styles(),
  ];
  if (prod) {
    plugins = [
      ...plugins,
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
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
