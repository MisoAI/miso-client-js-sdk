const path = require('path');

module.exports = function(config) {
  config.addPassthroughCopy({
    'doc/asset': '/'
  });
  config.setBrowserSyncConfig({
		files: './doc-dist/css/**/*.css'
	});
  return {
    pathPrefix: '/miso-client-js-sdk/',
    dir: {
      input: 'doc',
      output: 'doc-dist'
    }
  }
};
