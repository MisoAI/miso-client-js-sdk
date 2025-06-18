import { indent } from './helpers.js';

export function sdk({ sdk = 'misocmd' } = {}, body) {
  switch (sdk) {
    case 'module':
      return module(body);
    case 'misocmd':
      return misocmd(body);
    default:
      throw new Error(`Invalid SDK setup option: ${sdk}`);
  }
}

export function misocmd(body) {
  return `
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
${indent(body, 2)}
});
`.trim();
}

export function module(body) {
  return `
import MisoClient from '@miso.ai/client-sdk';

${body}
`.trim();
}
