import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { buildFilters } from '../src/filter/index.js';

const mockAlgoliaClient = {};
const build = filters => buildFilters(mockAlgoliaClient, filters);

describe('filters', run => {
  run('empty', {});
  run('facet', { filters: '[a:x]' }, 'a:x');
  run('facet + whitespace', { filters: '[a:x w]' }, 'a:"x w"');
  run('numeric: range', { filters: 'a:0.5 TO 2' }, 'a:[0.5 TO 2]');
  run('numeric: =', { filters: 'a = 1.5' }, 'a:1.5');
  run('numeric: !=', { filters: 'a != 1.5' }, '(NOT a:1.5)');
  run('numeric: <', { filters: 'a < 1.5' }, 'a:[* TO 1.5}');
  run('numeric: <=', { filters: 'a <= 1.5' }, 'a:[* TO 1.5]');
  run('numeric: >', { filters: 'a > 1.5' }, 'a:{1.5 TO *]');
  run('numeric: >=', { filters: 'a >= 1.5' }, 'a:[1.5 TO *]');
  run('tag: implicit', { filters: 'a' }, 'tags:a');
  run('tag: explicit', { filters: '_tags:a' }, 'tags:a');
  run('disjunction', { filters: 'a:x OR b:y' }, 'a:x OR b:y');
  run('conjunction', { filters: 'a:x AND b:y' }, 'a:x AND b:y');
  run('quote', { filters: '"[_tags:a]":"x > y"' }, '"[_tags:a]":"x > y"');
  run('quote', { filters: '"x > y"' }, 'tags:"x > y"');
  run('bare NOT', { filters: 'a:x OR NOT b:y' }, 'a:x OR (NOT b:y)');
  run('bare NOT', { filters: 'a:x AND NOT b:y' }, 'a:x AND (NOT b:y)');
}, run);

describe('facetFilters', run => {
  run('simple', { facetFilters: ['a:x'] }, 'a:x');
  run('simple + whitespace', { facetFilters: ['a:x w'] }, 'a:"x w"');
  run('disjunction', { facetFilters: [['a:x']] }, 'a:x');
  run('disjunction', { facetFilters: [['a:x', 'b:y']] }, '(a:x OR b:y)');
  run('disjunction', { facetFilters: [['a:x', 'b:y', 'c:z']] }, '(a:x OR b:y OR c:z)');
  run('disjunction + whitespace', { facetFilters: [['a:x w']] }, 'a:"x w"');
  run('disjunction + whitespace', { facetFilters: [['a:x', 'b:y w']] }, '(a:x OR b:"y w")');
  run('disjunction + whitespace', { facetFilters: [['a:x', 'b:y w', 'c:z']] }, '(a:x OR b:"y w" OR c:z)');
  run('conjunction', { facetFilters: ['a:x', 'b:y'] }, 'a:x AND b:y');
  run('conjunction', { facetFilters: ['a:x', 'b:y', 'c:z'] }, 'a:x AND b:y AND c:z');
  run('conjunction + whitespace', { facetFilters: ['a:x', 'b:y w'] }, 'a:x AND b:"y w"');
  run('conjunction + whitespace', { facetFilters: ['a:x', 'b:y w', 'c:z'] }, 'a:x AND b:"y w" AND c:z');
  run('negation', { facetFilters: ['a:-x'] }, '(NOT a:x)');
  run('negation escaped', { facetFilters: ['a:\\-x'] }, 'a:"-x"');
  run('negation + whitespace', { facetFilters: ['a:-x w'] }, '(NOT a:"x w")');
  run('negation escaped + whitespace', { facetFilters: ['a:\\-x w'] }, 'a:"-x w"');
}, run);

describe('numericFilters', run => {
  run('basic: range', { numericFilters: ['a:0.5 TO 2'] }, 'a:[0.5 TO 2]');
  run('basic: =', { numericFilters: ['a = 1.5'] }, 'a:1.5');
  run('basic: !=', { numericFilters: ['a != 1.5'] }, '(NOT a:1.5)');
  run('basic: <', { numericFilters: ['a < 1.5'] }, 'a:[* TO 1.5}');
  run('basic: <=', { numericFilters: ['a <= 1.5'] }, 'a:[* TO 1.5]');
  run('basic: >', { numericFilters: ['a > 1.5'] }, 'a:{1.5 TO *]');
  run('basic: >=', { numericFilters: ['a >= 1.5'] }, 'a:[1.5 TO *]');
}, run);

describe('tagFilters', run => {
  run('simple', { tagFilters: ['a'] }, 'tags:a');
  run('simple + whitespace', { tagFilters: ['a w'] }, 'tags:"a w"');
  run('disjunction', { tagFilters: [['a']] }, 'tags:a');
  run('disjunction', { tagFilters: [['a', 'b']] }, '(tags:a OR tags:b)');
  run('disjunction', { tagFilters: [['a', 'b', 'c']] }, '(tags:a OR tags:b OR tags:c)');
  run('disjunction + whitespace', { tagFilters: [['a w']] }, 'tags:"a w"');
  run('disjunction + whitespace', { tagFilters: [['a', 'b w']] }, '(tags:a OR tags:"b w")');
  run('disjunction + whitespace', { tagFilters: [['a', 'b w', 'c']] }, '(tags:a OR tags:"b w" OR tags:c)');
  run('conjunction', { tagFilters: ['a', 'b'] }, 'tags:a AND tags:b');
  run('conjunction', { tagFilters: ['a', 'b', 'c'] }, 'tags:a AND tags:b AND tags:c');
  run('conjunction + whitespace', { tagFilters: ['a', 'b w'] }, 'tags:a AND tags:"b w"');
  run('conjunction + whitespace', { tagFilters: ['a', 'b w', 'c'] }, 'tags:a AND tags:"b w" AND tags:c');
  run('mixed', { tagFilters: ['a', ['b', 'c'], 'd'] }, 'tags:a AND (tags:b OR tags:c) AND tags:d');
  run('mixed + whitespace', { tagFilters: ['a', ['b', 'c w'], 'd w'] }, 'tags:a AND (tags:b OR tags:"c w") AND tags:"d w"');
}, run);

function describe(group, fn, run) {
  fn((...args) => run(group, ...args));
}

function run(group, name, parameters, fq) {
  test(`${group}:${name}`, () => {
    assert.equal(build(parameters), fq === undefined ? {} : { fq });
  });
}

test.run();
