
const CIRCLED_DIGITS = '➀➁➂➃➄➅➆➇➈➉';
const NEGATIVE_CIRCLED_DIGITS = '➊➋➌➍➎➏➐➑➒➓';

export function dingbatChar(index, negative) {
  return (negative ? NEGATIVE_CIRCLED_DIGITS : CIRCLED_DIGITS).charAt(index) || '';
}
