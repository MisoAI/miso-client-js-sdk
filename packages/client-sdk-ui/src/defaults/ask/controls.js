import { followUp as followUpTemplate } from './templates.js';

export function wireFollowUps(client, element, options) {
  if (!client) {
    throw new Error('client is required');
  }
  // backward compatible
  setFollowUpTemplate(client, options);
  replaceFollowUpsElement(element);
}

function setFollowUpTemplate(client, { template = followUpTemplate, ...options } = {}) {
  if (typeof template !== 'function') {
    throw new Error('template must be a function or undefined');
  }
  const hasExtraOptions = Object.keys(options).length > 0;
  if (template === followUpTemplate && !hasExtraOptions) {
    return; // same as default
  }
  client.ui.asks.useTemplates({
    followUp: hasExtraOptions ? (args) => template({ ...options, ...args }) : template,
  });
}

function replaceFollowUpsElement(element) {
  if (!element || element.tagName.toLowerCase() === 'miso-follow-ups') {
    return;
  }
  // replace element with <miso-follow-ups>, carrying over attributes
  const newElement = document.createElement('miso-follow-ups');
  for (const { name, value } of element.attributes) {
    newElement.setAttribute(name, value);
  }
  element.parentNode.replaceChild(newElement, element);
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
