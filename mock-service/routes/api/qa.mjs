import Router from '@koa/router';
import { respondSuccess } from './util.mjs';

// TODO: 4xx

// TODO
const question_answering = core => async ctx => {
  respondSuccess(core, ctx, {
    answers: [],
    total: 100,
    spellcheck: {
      spelling_errors: false
    }
  });
}

// TODO
const question_autocomplete = core => async ctx => {
  respondSuccess(core, ctx, {
    completions: []
  });
}

export default function createRouter(core) {
  return new Router()
    .post('/question_answering', question_answering(core))
    .post('/question_autocomplete', question_autocomplete(core));
};
