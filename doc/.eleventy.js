const { EleventyRenderPlugin } = require("@11ty/eleventy");
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
// const toc = require('eleventy-plugin-toc');
const yaml = require('js-yaml');
const Data = require('./util/data');
const Helpers = require('./util/helpers');

const markdown = markdownIt({ html: true }).use(markdownItAnchor);

module.exports = function(config) {
  config.setLibrary('md', markdown);
  config.addPlugin(EleventyRenderPlugin);
  config.addPlugin(syntaxHighlight);
  // config.addPlugin(toc, { tags: ['h2', 'h3'] });
  config.addDataExtension('yml', contents => yaml.load(contents));

  config.addPassthroughCopy({
    'asset': '/'
  });
  config.setBrowserSyncConfig({
		files: './dist/css/**/*.css'
	});

  config.addNunjucksFilter('markdown', value => markdown.renderInline(value));

  const data = new Data();
  config.addNunjucksGlobal('data', data);
  config.on('eleventy.before', () => data.refresh());
  config.addNunjucksGlobal('helpers', new Helpers());

  config.addGlobalData('layout', 'base.njk');
  config.addGlobalData('hostname', 'misoai.github.io');

  return {
    markdownTemplateEngine: 'njk', // 11ty offers stronger context support with njk toolchain
    pathPrefix: '/miso-client-js-sdk/',
    dir: {
      input: 'page',
      includes: '../_includes',
      layouts: '../_layouts',
      data: '../_data',
      output: 'dist'
    }
  }
};
