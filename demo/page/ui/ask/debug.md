---
---

{% raw %}
<style>
  .btn-group * {
    box-shadow: none !important;
  }
  #reload-btn {
    margin-left: 0.5em;
  }
  .phrase {
    font-size: .875rem;
    line-height: 1.2;
    margin: 1rem auto;
    color: #999;
  }
  .miso-list {
    --miso-list-item-height: 7rem;
    --miso-list-item-gap: 0.65rem;
    --miso-list-description-lines: 3;
  }
</style>
<section>
  <button type="button" class="btn btn-primary" id="save-log-btn">Save Log</button>
  <hr>
</section>
<section>
  <miso-ask>
    <miso-query></miso-query>
  </miso-ask>
</section>
<section>
  <miso-ask visible-when="ready">
    <div class="phrase">You asked about...</div>
    <miso-question></miso-question>
    <hr>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
    <hr>
    <div class="phrase">My reply is based on the following:</div>
    <miso-sources></miso-sources>
    <div class="phrase" style="margin-top: 4rem;">Go beyond, and learn more about this topic:</div>
    <miso-related-resources></miso-related-resources>
  </miso-ask>
</section>
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
  MisoClient.plugins.use('std:ui');
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
});
</script>
{% endraw %}
