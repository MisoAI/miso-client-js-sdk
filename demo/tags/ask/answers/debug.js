window.debug = (() => {

  const _fns = {};
  const logs = [];
  
  function injectConsole(method) {
    _fns[method] = console[method].bind(console);
    console[method] = (...args) => {
      logs.push([method, ...args]);
      return _fns[method](...args);
    }
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
    const url = URL.createObjectURL(blob, { oneTimeOnly: true });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sdk-log.jsonl';
    a.click();
  }

  return (MisoClient) => {
    // CSS
    document.body.classList.add('debug');

    // turn on debug plugin
    MisoClient.plugins.use('std:ui');
    MisoClient.plugins.use('std:debug');

    // send typewriter debug info to console
    const startTime = Date.now();
    const onTypewriterDebug = ({ summary, timestamp, elapsed, ref, operation, conflict }) => console.log(`[${(timestamp - startTime) / 1000}](${elapsed[0] / 1000}, ${elapsed[1] / 1000})`, summary, ref, `${operation}`, conflict);
    const setupWorkflow = workflow => workflow.useLayouts({ answer: { onDebug: onTypewriterDebug } });

    MisoClient.on('create', client => {
      setupWorkflow(client.ui.ask);
      client.ui.asks.on('create', setupWorkflow);
    });
    
    // inject console
    for (const method of ['log', 'info', 'warn', 'error']) {
      injectConsole(method);
    }
  
    // save log button
    const button = document.getElementById('save-log-btn');
    button && button.addEventListener('click', downloadLogs);
  };

})();
