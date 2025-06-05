import { codegen, spec, encodeConfig, decodeConfig } from '@miso.ai/client-sdk-codegen';
import { getModel } from './_codegen-model.js';

const workflow = window.location.pathname.replace(/\/$/, '').split('/').slice(-2, -1)[0];
const model = getModel(workflow);

//model.on('*', event => console.log(event));
