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
        asset_path: `/miso-client-js-sdk${path}`,
        url: path.replace('/tags/', `/${sdk_version}/`).replace('/intro', ''),
      }));
    },
  },
  sdk_version: ['latest', 'beta', '1.8.2-beta.4', '1.8.2-beta.7'],
  permalink: '{{ pginfo.url }}/',
};
