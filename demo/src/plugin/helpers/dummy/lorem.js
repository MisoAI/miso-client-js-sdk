import DEFAULT_WORDS from './words.yaml';
import { randomInt } from './utils';

export function lorem({ decorates = [], min, max, n, output = 'string', ...options } = {}) {
  let iterator = limit({ min, max, n })(base(options));
  for (const decorate of decorates) {
    iterator = lookup(decorate)(iterator);
  }
  return lookup(output)(iterator);
}

const FNS = {
  string,
  array,
  title,
  description,
}

function lookup(fn) {
  return typeof fn === 'string' ? FNS[fn]() : fn();
}

// base //
export function *base({ words = DEFAULT_WORDS, fixedStarts = 2 } = {}) {
  const wordsLength = words.length;
  for (let i = 0; ; i++) {
    yield words[i < fixedStarts ? i : Math.floor(Math.random() * wordsLength)];
  }
}

// output //
export function string({ separator = ' ' } = {}) {
  return iterator => [...iterator].join(separator);
}

export function array() {
  return iterator => [...iterator];
}

// decorators //
export function limit({ n, min = 5, max = 10 }) {
  n = n || randomInt(min, max);
  return function *(iterator) {
    let i = 0;
    for (let word of iterator) {
      if (i++ >= n) {
        break;
      }
      yield word;
    }
  };
}

export function title({} = {}) {
  return function *(iterator) {
    for (let word of iterator) {
      yield capitalize(word);
    }
  };
}

export function description({
  wordsPerSentenceAvg = 24,
  wordsPerSentenceStd = 5,
} = {}) {
  return function *(iterator) {
    let word;
    let slen = 0;
    for (let _word of iterator) {
      if (word) {
        yield word;
      }
      word = _word;
      if (slen === 0) {
        word = capitalize(word);
        slen = Math.max(1, gaussMS(wordsPerSentenceAvg, wordsPerSentenceStd));
      }
      if (--slen === 0) {
        word += '.';
      }
    }
    if (word) {
      if (!word.endsWith('.')) {
        word += '.';
      }
      yield word;
    }
  };
}

// helpers //
function capitalize(word) {
  return word[0].toUpperCase() + word.substring(1);
}

function gaussMS(mean, std) {
  return Math.round(gaussRandom() * std + mean);
}

function gaussRandom() {
  return uniformRandom() + uniformRandom() + uniformRandom();
}

function uniformRandom() {
  return Math.random() * 2 - 1;
}
