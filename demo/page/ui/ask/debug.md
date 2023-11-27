---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const _fns = {};
const logs = [];
function injectLogger(method) {
  _fns[method] = console[method].bind(console);
  console[method] = (...args) => {
    logs.push([method, ...args]);
    return _fns[method](...args);
  }
}
for (const method of ['log', 'info', 'warn', 'error']) {
  injectLogger(method);
}
function shimLogValue(v) {
  if (typeof v === 'function') {
    return v.name;
  }
  if (Array.isArray(v)) {
    return v.map(shimLogValue);
  }
  if (v instanceof window.Element) {
    return `<${v.tagName.toLowerCase()}>`;
  }
  if (typeof v === 'object') {
    if (v.constructor !== window.Object) {
      return `${v}`;
    }
    const obj = {};
    for (const k in v) {
      obj[k] = shimLogValue(v[k]);
    }
    return obj;
  }
  return v;
}
function stringifyLogs() {
  content = '';
  for (const log of logs) {
    content += JSON.stringify(shimLogValue(log.filter(v => typeof v !== 'string' || (!v.startsWith('%c') && !v.startsWith('color:'))))) + '\n';
  }
  return content;
}
function downloadLogs() {
  const blob = new Blob([stringifyLogs()], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sdk-log.jsonl';
  a.click();
  URL.revokeObjectURL(url);
}
document.getElementById('save-log-btn').addEventListener('click', downloadLogs);
</script>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const start = Date.now();
  const onDebug = ({ summary, timestamp, elapsed, ref, operation, conflict }) => console.log(`[${(timestamp - start) / 1000}](${elapsed[0] / 1000}, ${elapsed[1] / 1000})`, summary, ref, `${operation}`, conflict);
  const workflow = client.ui.ask;
  workflow.useLayouts({
    answer: { onDebug },
  });
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
});
</script>
{% endraw %}
