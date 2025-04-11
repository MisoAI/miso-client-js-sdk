import { codegen, decodeParameters } from '@miso.ai/client-sdk-codegen';

const workflow = window.location.pathname.replace(/\/$/, '').split('/').pop();
const searchParams = new URLSearchParams(window.location.search);
const config = decodeParameters(searchParams.get('c'));
const apiKey = searchParams.get('api-key') || undefined;

const { js, html } = codegen({ workflow, ...config, apiKey });

// write HTML
if (html) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('demo').innerHTML = html;
  });
}

// write JS
if (js) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.textContent = js;
  document.head.appendChild(script);
}
