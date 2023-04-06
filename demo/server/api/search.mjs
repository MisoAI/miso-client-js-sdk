import Router from '@koa/router';
import { v4 as uuid } from 'uuid';
import { lorem } from '../util/index.mjs';

const router = new Router();

const WPS = 20;
const TEXT_FETCHING = `Fetching results ...`;
const TEXT_GENERATING = `Generating answer ...`;

function formatDatetime(timestamp) {
  const str = new Date(timestamp).toISOString();
  return str.endsWith('Z') ? str.slice(0, -1) : str;
}

const answers = new Map();

class Answer {

  constructor(question, previous_answer_id) {
    this.question = question;
    this.previous_answer_id = previous_answer_id;
    this.timestamp = Date.now();
    this.datetime = formatDatetime(this.timestamp);
    this.uuid = uuid();
    this.answer = lorem.lorem({
      min: 50,
      max: 100,
      decorates: ['description'],
      output: 'array',
    });
    this.in_response_to = previous_answer_id && answers.get(previous_answer_id) || undefined;
    answers.set(this.uuid, this);
  }

  get() {
    const now = Date.now();
    const elapsed = (now - this.timestamp) / 1000;
    const wordCount = Math.floor(elapsed * WPS);
    const finished = wordCount >= this.answer.length;
    const answer = (finished ? this.answer : this.answer.slice(0, wordCount)).join(' ');
    const { uuid, question, datetime, in_response_to } = this;

    return {
      affiliation: undefined,
      answer,
      answer_id: uuid,
      datetime,
      finished,
      further_items: [], // TODO
      further_total: 0,
      in_response_to: in_response_to && in_response_to.get(),
      question,
      sources: [], // TODO
      uuid,
    };
  }

}

router.post('/questions', (ctx) => {
  const { q: question, previous_answer_id } = JSON.parse(ctx.request.body);
  const answer = new Answer(question, previous_answer_id);
  ctx.body = JSON.stringify(answer.get());
});

router.get('/answers/:id', (ctx) => {
  const { id } = ctx.params;
  const answer = answers.get(id);
  if (!answer) {
    ctx.status = 404;
  } else {
    ctx.body = JSON.stringify(answer.get());
  }
});

export default router;
