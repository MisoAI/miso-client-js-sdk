import { codegen, decodeConfig } from '@miso.ai/client-sdk-codegen';

const workflow = window.location.pathname.replace(/\/$/, '').split('/').pop();
const searchParams = new URLSearchParams(window.location.search);
const config = decodeConfig(searchParams.get('c'));
const apiKey = searchParams.get('api-key') || undefined;

const styles = [];
const scripts = [];
const htmls = [];

for (const { type, content } of codegen({ ...config, workflow, apiKey })) {
  switch (type) {
    case 'css':
      styles.push(content);
      break;
    case 'js':
      scripts.push(content);
      break;
    case 'html':
      htmls.push(content);
      break;
    default:
      throw new Error(`Unrecognized type: "${type}"`);
  }
}

// write HTML
if (htmls.length) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('demo').innerHTML = htmls.join('\n');
  });
}

// write CSS
for (const style of styles) {
  const styleElement = document.createElement('style');
  styleElement.textContent = style;
  document.head.appendChild(styleElement);
}

// write JS
for (const script of scripts) {
  const scriptElement = document.createElement('script');
  scriptElement.type = 'text/javascript';
  scriptElement.async = true;
  scriptElement.textContent = script;
  document.head.appendChild(scriptElement);
}
