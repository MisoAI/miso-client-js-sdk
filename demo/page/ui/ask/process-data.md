---
---

{% raw %}
<p>
  Use <code>workflow.useDataProcessor()</code> to add a "Wooof!" string to the answer.
</p>
{% endraw %}
{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  //const workflow = client.ui.ask;
  client.ui.asks.useDataProcessor(data => {
    const { value } = data;
    if (!value) {
      return data;
    }
    const { answer } = value;
    if (!answer) {
      return data;
    }
    return {
      ...data,
      value: {
        ...value,
        answer: `Wooof!\n${answer}`,
      },
    };
  });
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
});
</script>
{% endraw %}
