import { buildFilters } from './index';

const mockAlgoliaClient = {};
const build = filters => buildFilters(mockAlgoliaClient, filters);

describe('filters', () => {
  run('empty', {});
  run('facet', { filters: '[a:x]' }, 'a:x');
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
});

describe('facetFilters', () => {
  run('simple', { facetFilters: ['a:x'] }, 'a:x');
  run('disjunction', { facetFilters: [['a:x']] }, 'a:x');
  run('disjunction', { facetFilters: [['a:x', 'b:y']] }, '(a:x OR b:y)');
  run('disjunction', { facetFilters: [['a:x', 'b:y', 'c:z']] }, '(a:x OR b:y OR c:z)');
  run('conjunction', { facetFilters: ['a:x', 'b:y'] }, 'a:x AND b:y');
  run('conjunction', { facetFilters: ['a:x', 'b:y', 'c:z'] }, 'a:x AND b:y AND c:z');
  run('negation', { facetFilters: ['a:-x'] }, '(NOT a:x)');
  run('negation escaped', { facetFilters: ['a:\\-x'] }, 'a:"-x"');
});

describe('numericFilters', () => {
  run('basic: range', { numericFilters: ['a:0.5 TO 2'] }, 'a:[0.5 TO 2]');
  run('basic: =', { numericFilters: ['a = 1.5'] }, 'a:1.5');
  run('basic: !=', { numericFilters: ['a != 1.5'] }, '(NOT a:1.5)');
  run('basic: <', { numericFilters: ['a < 1.5'] }, 'a:[* TO 1.5}');
  run('basic: <=', { numericFilters: ['a <= 1.5'] }, 'a:[* TO 1.5]');
  run('basic: >', { numericFilters: ['a > 1.5'] }, 'a:{1.5 TO *]');
  run('basic: >=', { numericFilters: ['a >= 1.5'] }, 'a:[1.5 TO *]');
});

describe('tagFilters', () => {
  run('simple', { tagFilters: ['a'] }, 'tags:a');
  run('disjunction', { tagFilters: [['a']] }, 'tags:a');
  run('disjunction', { tagFilters: [['a', 'b']] }, '(tags:a OR tags:b)');
  run('disjunction', { tagFilters: [['a', 'b', 'c']] }, '(tags:a OR tags:b OR tags:c)');
  run('conjunction', { tagFilters: ['a', 'b'] }, 'tags:a AND tags:b');
  run('conjunction', { tagFilters: ['a', 'b', 'c'] }, 'tags:a AND tags:b AND tags:c');
  run('mixed', { tagFilters: ['a', ['b', 'c'], 'd'] }, 'tags:a AND (tags:b OR tags:c) AND tags:d');
});

function run(name, parameters, fq) {
  it(name, () => {
    expect(build(parameters)).toStrictEqual(fq === undefined ? {} : { fq });
  });
}
