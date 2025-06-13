import { createApp } from 'vue';
import { MisoCodegenConfigViewModel } from './_codegen-model.js';
import CodegenApp from './_codegen-app.vue';

const workflow = window.location.pathname.replace(/\/$/, '').split('/').slice(-2, -1)[0];
const model = new MisoCodegenConfigViewModel({ workflow, preset: 'standard' });

// Create and mount the Vue app
const app = createApp(CodegenApp, { model });
app.mount('#root');

// For debugging
window.app = app;
window.model = model;
