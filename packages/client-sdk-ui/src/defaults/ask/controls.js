import { followUp as followUpTemplate } from './templates.js';

export function wireFollowUps(client, element, { template = followUpTemplate, ...options } = {}) {
  if (!client) {
    throw new Error('client is required');
  }
  if (typeof template !== 'function') {
    throw new Error('template must be a function or undefined');
  }
  if (!element) {
    return;
  }
  const context = client.ui.asks;
  const rootWorkflow = client.ui.ask;

  // 1. when an answer is fully populated, insert a new section for the follow-up question
  context.on('done', (event) => {
    element.insertAdjacentHTML('beforeend', template({ ...options, parentQuestionId: event.workflow.questionId }));
  });
  // 2. if user starts over, clean up existing follow-up questions
  rootWorkflow.on('loading', () => {
    // clean up the entire follow-ups section
    element.innerHTML = '';
    // destroy all follow-up workflows
    context.reset({ root: false });
  });
}

export function wireRelatedResources(client, element) {
  if (!client) {
    throw new Error('client is required');
  }
  if (!element) {
    return;
  }
  client.ui.asks.on('loading', (event) => {
    // When a new query starts, associate the last section container (for related resources) to that workflow
    for (const container of element.querySelectorAll('miso-ask')) {
      container.workflow = event.workflow;
    }
  });
}
