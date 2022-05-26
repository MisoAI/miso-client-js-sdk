let indicies = {};

class Helpers {

  constructor() {}

  isCurrentPage(pageUrl, region, path) {
    return pageUrl === '/' + region + (path || '') + '/';
  }

  getIndex(pageUrl) {
    if (!indicies[pageUrl]) {
      indicies[pageUrl] = 1; // start with 1 to avoid falsy value
    }
    return indicies[pageUrl]++;
  }

}

module.exports = Helpers;
