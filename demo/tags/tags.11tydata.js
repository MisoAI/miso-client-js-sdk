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
        asset_path: `/miso-client-js-sdk/demo/asset`,
        src_path: `/miso-client-js-sdk${path}`,
        url: path.replace('/tags/', `/${sdk_version}/`).replace('/intro', ''),
      }));
    },
  },
  sdk_version: ['latest', 'beta', 'v1.9.10', 'v1.9.10-beta.0'],
  permalink: '{{ pginfo.url }}/',
};
