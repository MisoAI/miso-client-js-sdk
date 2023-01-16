const { join } = require('path');
const { spec, utils } = require('@miso.ai/doc-utils');

const DATA_DIR = join(__dirname, '../_data');

function getComparisonGroup(file) {
  let { header, groups } = utils.readYamlSync(join(DATA_DIR, file));
  groups = groups.reduce((m, { props, ...group }) => {
    props = props.map(({ left, right, ...prop }) => ({
      ...prop,
      left: utils.asArray(left),
      right: utils.asArray(right),
    }));
    m[group.key] = { ...group, props };
    return m;
  }, {});
  return Object.freeze({ header, groups });
}

function computeComparisons() {
  return Object.freeze({
    algolia: getComparisonGroup('comparison/algolia.yml'),
  });
}

function compute() {
  return Object.freeze({
    props: utils.props.buildDir(join(DATA_DIR, 'prop')),
    event: spec.event,
    comparisons: computeComparisons(),
    pageMeta: utils.sitemap(join(DATA_DIR, 'sitemap')),
  });
}

class Data {
  constructor() {
    this.refresh();
  }
  refresh() {
    this._data = compute();
  }
  get props() {
    return this._data.props;
  }
  get event() {
    return this._data.event;
  }
  get comparisons() {
    return this._data.comparisons;
  }
  get pageMeta() {
    return this._data.pageMeta;
  }
}

module.exports = Data;
