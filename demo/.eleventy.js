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

  config.addNunjucksGlobal('helpers', new Helpers());
  config.addGlobalData('layout', 'base.njk');
  config.addGlobalData('DEFAULT_ASK_API_KEY', process.env.DEFAULT_ASK_API_KEY);
  config.addGlobalData('DEFAULT_AFFILIATION_ASK_API_KEY', process.env.DEFAULT_AFFILIATION_ASK_API_KEY);
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

  codegen(config) {
    const apiKey = resolveApiKey(config);
    // TODO: we need this to watch for codegen package changes
    const { js, html } = codegen({ dryRun: true, ...config, apiKey });
    return `
<script async>
${js}
</script>
${html}
`;
  }
}

function resolveApiKey(config) {
  let { apiKey = '' } = config;
  if (!apiKey) {
    apiKey = config.workflow === 'search' || config.workflow === 'recommendation' ? 'env.DEFAULT_API_KEY' : 'env.DEFAULT_ASK_API_KEY';
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
