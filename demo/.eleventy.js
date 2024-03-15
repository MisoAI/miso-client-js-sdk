require ('dotenv/config');

const { EleventyRenderPlugin } = require("@11ty/eleventy");
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const yaml = require('js-yaml');

const markdown = markdownIt({ html: true }).use(markdownItAnchor);

module.exports = function(config) {
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
  config.setServerOptions({
    liveReload: false, // for AMP
    domDiff: false,
  });

  config.addNunjucksFilter('markdown', value => markdown.renderInline(value));

  config.addNunjucksGlobal('helpers', new Helpers());
  config.addGlobalData('layout', 'base.njk');
  config.addGlobalData('DEFAULT_ASK_API_KEY', process.env.DEFAULT_ASK_API_KEY);

  return {
    markdownTemplateEngine: 'njk', // 11ty offers stronger context support with njk toolchain
    dir: {
      input: 'page',
      includes: '../_includes',
      layouts: '../_layouts',
      data: '../_data',
      output: 'dist'
    },
  }
};

class Helpers {

  constructor() {}

  isCurrentPage(pageUrl, chapter, path) {
    return pageUrl === '/' + chapter + (path || '') + '/';
  }

}
