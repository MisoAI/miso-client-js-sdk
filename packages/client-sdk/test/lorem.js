import { test } from 'uvu';
import * as assert from 'uvu/assert';

import MisoClient from '../src/detached/node.js';
import { LoremPlugin } from '@miso.ai/client-sdk-dev-tool';

MisoClient.plugins.install(LoremPlugin);

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

test.run();
