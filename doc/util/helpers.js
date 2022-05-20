class Helpers {

  constructor() {}

  isCurrentPage(pageUrl, region, path) {
    return pageUrl === '/' + region + (path || '') + '/';
  }

}

module.exports = Helpers;