import { kebabOrSnakeToHuman, capitalize } from '@miso.ai/commons';

export function toName(str) {
  return capitalize(kebabOrSnakeToHuman(str));
}
