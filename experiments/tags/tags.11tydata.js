module.exports = {
  layout: 'demo',
  pagination: {
    data: 'sdk_version',
    size: 1,
    alias: 'pginfo',
    before: function(paginationData, { page }) {
      const { filePathStem } = page;
      const path = filePathStem.replace('/index', '');
      return paginationData.map(sdk_version => ({
        sdk_version,
        src_path: `/miso-client-js-sdk${path}`,
        url: path.replace('/tags/', `/${sdk_version}/`),
      }));
    },
  },
  sdk_version: ['latest', 'beta', 'v1.9.9', 'v1.9.9-beta.1'],
  permalink: '{{ pginfo.url }}/',
};
