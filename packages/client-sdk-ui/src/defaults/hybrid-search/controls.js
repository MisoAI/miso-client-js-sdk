import AnswerBox from './answer-box.js';

export function wireAnswerBox(client, element) {
  if (!client) {
    throw new Error('client is required');
  }
  if (!element) {
    return;
  }
  new AnswerBox(client, element);
}
