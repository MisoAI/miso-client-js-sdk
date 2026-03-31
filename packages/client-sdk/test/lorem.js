import { test } from 'uvu';
import * as assert from 'uvu/assert';

import MisoClient from '../src/detached/node.js';
import { LoremPlugin } from '@miso.ai/client-sdk-dev-tool';

MisoClient.plugins.use(LoremPlugin, { seed: 42 });

test('lorem: MisoClient instantiates without API key', () => {
  const client = new MisoClient();
  client.context.anonymous_id = 'lorem_user';
  assert.ok(client);
});

test('lorem: ask.questions returns an Answer with questionId', async () => {
  const client = new MisoClient();
  const answer = await client.api.ask.questions({ question: 'What is Miso?' });
  assert.ok(answer);
  assert.type(answer.questionId, 'string');
});

test('lorem: ask.questions returns the same questionId by reconfiguring seed', async () => {
  const client = new MisoClient();
  MisoClient.plugins.use(LoremPlugin, { seed: 43 });
  const answer0 = await client.api.ask.questions({ question: 'What is Miso?' });
  MisoClient.plugins.use(LoremPlugin, { seed: 43 });
  const answer1 = await client.api.ask.questions({ question: 'What is Miso?' });
  assert.ok(answer0);
  assert.ok(answer1);
  assert.type(answer0.questionId, 'string');
  assert.type(answer1.questionId, 'string');
  assert.is(answer0.questionId, answer1.questionId);
});

test('lorem: ask.questions returns the same questionId for the same seed', async () => {
  const client = new MisoClient();
  const answer0 = await client.api.ask.questions({ question: 'What is Miso?' }, { seed: 44 });
  const answer1 = await client.api.ask.questions({ question: 'What is Miso?' }, { seed: 44 });
  assert.ok(answer0);
  assert.ok(answer1);
  assert.type(answer0.questionId, 'string');
  assert.type(answer1.questionId, 'string');
  assert.is(answer0.questionId, answer1.questionId);
});

test('lorem: ask.questions returns the different questionId without seed', async () => {
  const client = new MisoClient();
  const answer0 = await client.api.ask.questions({ question: 'What is Miso?' });
  const answer1 = await client.api.ask.questions({ question: 'What is Miso?' });
  assert.ok(answer0);
  assert.ok(answer1);
  assert.type(answer0.questionId, 'string');
  assert.type(answer1.questionId, 'string');
  assert.is.not(answer0.questionId, answer1.questionId);
});

test.run();
