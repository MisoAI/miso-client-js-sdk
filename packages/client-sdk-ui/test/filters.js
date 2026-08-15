import { test } from 'uvu';
import * as assert from 'uvu/assert';

import Filters from '../src/actor/filters.js';
import * as fields from '../src/actor/fields.js';

// Minimal stand-in for the views actor: Filters only needs a hub to write the
// resolved state into, an options object to read, and an error sink.
function createViews(filtersOptions = {}) {
  const written = {};
  return {
    _hub: {
      update(field, states) {
        written[field] = states;
      },
    },
    _options: {
      on() {
        return () => {};
      },
      resolved: { filters: filtersOptions },
    },
    _error(error) {
      throw error;
    },
    written,
  };
}

function appliedFacets(views, filters) {
  filters.apply({ silent: true });
  const states = views.written[fields.filters()];
  return (states && states.facets) || {};
}

test('update() merges facets per field instead of replacing the map', () => {
  const views = createViews();
  const filters = new Filters(views);

  filters.update({ facets: { type: ['User guides'] } });
  filters.update({ facets: { category_path_depth_1: ['Editorial'] } });

  const facets = appliedFacets(views, filters);
  assert.equal(facets.type, ['User guides'], 'the first field must survive the second update');
  assert.equal(facets.category_path_depth_1, ['Editorial']);
});

test('update() clears one field with undefined and leaves the others alone', () => {
  const views = createViews();
  const filters = new Filters(views);

  filters.update({ facets: { type: ['User guides'], category_path_depth_1: ['Editorial'] } });
  filters.update({ facets: { type: undefined } });

  const facets = appliedFacets(views, filters);
  assert.not.ok(facets.type, 'the field set to undefined must be gone');
  assert.equal(facets.category_path_depth_1, ['Editorial'], 'the other field must remain');
});

test('facets.unselect() does not drop filters on other fields', () => {
  const views = createViews();
  const filters = new Filters(views);

  filters.update({ facets: { type: ['User guides'], category_path_depth_1: ['Editorial'] } });
  filters.facets.unselect('category_path_depth_1', 'Editorial');

  const facets = appliedFacets(views, filters);
  assert.equal(facets.type, ['User guides'], 'unselecting one facet must not clear another field');
  assert.not.ok(facets.category_path_depth_1);
});

test('facets.toggle() across two fields keeps both selections', () => {
  const views = createViews();
  const filters = new Filters(views);

  filters.facets.toggle('category_path_depth_1', 'Editorial');
  filters.facets.toggle('type', 'User guides');

  const facets = appliedFacets(views, filters);
  assert.equal(facets.category_path_depth_1, ['Editorial']);
  assert.equal(facets.type, ['User guides']);
});

test('facets options are reachable, so multivalued selection works', () => {
  const views = createViews({ facets: { multivalued: true } });
  const filters = new Filters(views);

  filters.facets.select('type', 'User guides');
  filters.facets.select('type', 'Release notes');

  const facets = appliedFacets(views, filters);
  assert.equal(facets.type, ['Release notes', 'User guides'], 'both values are kept, sorted');
});

test('without multivalued, selecting replaces the value on that field', () => {
  const views = createViews();
  const filters = new Filters(views);

  filters.facets.select('type', 'User guides');
  filters.facets.select('type', 'Release notes');

  const facets = appliedFacets(views, filters);
  assert.equal(facets.type, ['Release notes']);
});

test.run();
