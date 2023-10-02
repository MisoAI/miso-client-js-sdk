const CIRCLED_DIGITS = '⓪①②③④⑤⑥⑦⑧⑨';
const NEGATIVE_CIRCLED_DIGITS = '⓿❶❷❸❹❺❻❼❽❾';

export function dingbatChar(index, negative) {
  return (negative ? NEGATIVE_CIRCLED_DIGITS : CIRCLED_DIGITS).charAt(index) || '';
}
