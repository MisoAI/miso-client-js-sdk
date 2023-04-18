import Router from '@koa/router';
import { v4 as uuid } from 'uuid';
import { lorem, products, articles, utils } from '../util/index.mjs';

const router = new Router();

const WPS = 20;
const ITEMS_LOADING_TIME = 3;
const STAGES = [
  {
    duration: 1.5,
    text: `Fetching results...`,
  },
  {
    duration: 1.5,
    text: `Generating answer...`,
  }
];

function formatDatetime(timestamp) {
  const str = new Date(timestamp).toISOString();
  return str.endsWith('Z') ? str.slice(0, -1) : str;
}

const answers = new Map();

class Answer {

  constructor(question, previous_question_id) {
    this.question_id = uuid();
    this.question = question;
    this.previous_answer_id = previous_question_id;
    this.timestamp = Date.now();
    this.datetime = formatDatetime(this.timestamp);

    this.answer = lorem.lorem({
      min: 50,
      max: 100,
      decorates: ['description'],
      output: 'array',
    });
    this.relatedResources = [...articles({ rows: utils.randomInt(6, 8) })];
    this.sources = [...articles({ rows: utils.randomInt(4, 6) })];

    this.previous_question_id = previous_question_id && answers.get(previous_question_id) || undefined;
    answers.set(this.question_id, this);
  }

  get() {
    const now = Date.now();
    const elapsed = (now - this.timestamp) / 1000;
    const [answer, finished] = this._answer(elapsed);
    const sources = this._sources(elapsed);
    const related_resources = this._relatedResources(elapsed);
    const { question_id, question, datetime, previous_question_id } = this;

    return {
      affiliation: undefined,
      answer,
      datetime,
      finished,
      previous_question_id,
      question,
      question_id,
      related_resources,
      sources,
    };
  }

  _answer(elapsed) {
    for (const stage of STAGES) {
      elapsed -= stage.duration;
      if (elapsed < 0) {
        return [stage.text, false];
      }
    }
    const wordCount = Math.floor(elapsed * WPS);
    const finished = wordCount >= this.answer.length;
    const text = (finished ? this.answer : this.answer.slice(0, wordCount)).join(' ');
    return [text, finished];
  }

  _sources(elapsed) {
    const { sources } = this;
    const { length } = sources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return sources.slice(0, loaded);
  }

  _relatedResources(elapsed) {
    const { relatedResources } = this;
    const { length } = relatedResources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return relatedResources.slice(0, loaded);
  }

}

router.post('/questions', (ctx) => {
  const { q: question, previous_answer_id } = JSON.parse(ctx.request.body);
  const answer = new Answer(question, previous_answer_id);
  ctx.body = JSON.stringify(answer.get());
});

router.get('/questions/:id/answer', (ctx) => {
  const { id } = ctx.params;
  const answer = answers.get(id);
  if (!answer) {
    ctx.status = 404;
  } else {
    ctx.body = JSON.stringify(answer.get());
  }
});

export default router;
