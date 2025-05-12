import { indent } from './helpers.js';

export function misocmd(body) {
  return `
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
${indent(body, 2)}
});
`.trim();
}
