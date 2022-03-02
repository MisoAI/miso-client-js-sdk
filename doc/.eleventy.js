const { EleventyRenderPlugin } = require("@11ty/eleventy");
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
// const toc = require('eleventy-plugin-toc');
const yaml = require('js-yaml');
const { propGroups } = require('./util/api-data');

const markdown = markdownIt({ html: true }).use(markdownItAnchor);

module.exports = function(config) {
  config.setLibrary('md', markdown);
  config.addPlugin(EleventyRenderPlugin);
  config.addPlugin(syntaxHighlight);
  // config.addPlugin(toc, { tags: ['h2', 'h3'] });
  config.addDataExtension('yml', contents => yaml.load(contents));

  config.addPassthroughCopy({
    'doc/asset': '/'
  });
  config.setBrowserSyncConfig({
		files: './doc-dist/css/**/*.css'
	});

  config.addNunjucksFilter('markdown', (value) => markdown.renderInline(value));

  config.addNunjucksGlobal('propGroups', propGroups);

  return {
    markdownTemplateEngine: 'njk', // 11ty offers stronger context support with njk toolchain
    pathPrefix: '/miso-client-js-sdk/',
    dir: {
      input: 'doc/page',
      includes: '../_includes',
      layouts: '../_layouts',
      data: '../_data',
      output: 'doc-dist'
    }
  }
};
