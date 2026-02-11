import 'dotenv/config';
import { EleventyRenderPlugin } from "@11ty/eleventy";
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { codegen } from '@miso.ai/client-sdk-codegen';
import yaml from 'js-yaml';
import Data from './data.js';

const markdown = markdownIt({
  html: true,
  breaks: true,
  linkify: true,
}).use(markdownItAnchor);

export default function(config) {
  config.setLibrary('md', markdown);
  config.addPlugin(EleventyRenderPlugin);
  config.addPlugin(syntaxHighlight);
  config.addDataExtension('yml', contents => yaml.load(contents));

  config.addPassthroughCopy({
    'asset': '/'
  });
  config.addPassthroughCopy('page/**/*.js');
  config.addWatchTarget('./scss/');
  config.addWatchTarget('./src/');
  config.addWatchTarget('./node_modules/@miso.ai/client-sdk-codegen/');
  config.setServerOptions({
    liveReload: false, // for AMP
    domDiff: false,
  });

  config.addNunjucksFilter('markdown', value => markdown.renderInline(value));

  config.addShortcode('icon', (name, { size = 16, ...attrs } = {}) => {
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-${name}" viewBox="0 0 16 16"${attrStr ? ' ' + attrStr : ''}><use xlink:href="/img/bootstrap-icons.svg#${name}"/></svg>`;
  });

  config.addNunjucksGlobal('helpers', new Helpers());
  config.addGlobalData('layout', 'base.njk');

  const API_KEYS = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith('_API_KEY')) {
      config.addGlobalData(key, value);
      API_KEYS.push([key, value]);
    }
  }
  config.addGlobalData('API_KEYS', API_KEYS);
  config.addGlobalData('DEFAULT_PRODUCT_ID', process.env.DEFAULT_PRODUCT_ID);

  const data = new Data();
  config.addNunjucksGlobal('data', data);
  config.on('eleventy.before', () => data.refresh());

  return {
    markdownTemplateEngine: 'njk', // 11ty offers stronger context support with njk toolchain
    dir: {
      input: 'page',
      includes: '../_includes',
      layouts: '../_layouts',
      data: '../_data',
      output: 'dist'
    },
  };
}

class Helpers {
  constructor() {}

  isCurrentPage(pageUrl, chapter, path) {
    return pageUrl === '/' + chapter + (path || '') + '/';
  }

  codegen(options) {
    const apiKey = resolveApiKey(options);
    // TODO: we need this to watch for codegen package changes
    return codegen({ ...options, dryRun: true, apiKey }).concat();
  }
}

function resolveApiKey(options) {
  let { apiKey = '' } = options;
  if (!apiKey) {
    apiKey = options.workflow === 'search' || options.workflow === 'recommendation' ? 'env.DEFAULT_API_KEY' : 'env.DEFAULT_ASK_API_KEY';
  }
  let i = 0;
  while (apiKey.startsWith('env.')) {
    apiKey = process.env[apiKey.slice(4)] || '';
    i++;
    if (i > 10) {
      break;
    }
  }
  return apiKey;
}
