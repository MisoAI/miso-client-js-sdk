import { defineAndUpgrade } from '@miso.ai/commons';
import MisoCodegenSnippetElement from './_codegen-snippet-element.js';
import MisoCodegenCodesElement from './_codegen-codes-element.js';
import MisoCodegenPresetsElement from './_codegen-presets-element.js';

export function defineElements() {
  defineAndUpgrade(MisoCodegenSnippetElement);
  defineAndUpgrade(MisoCodegenCodesElement);
  defineAndUpgrade(MisoCodegenPresetsElement);
}
