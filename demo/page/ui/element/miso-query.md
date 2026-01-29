---
---

{% raw %}
<div id="miso-ask-combo" class="miso-ask-combo">
  <miso-ask>
    <miso-query>
      <textarea data-role="input" placeholder="Ask anything..."></textarea>
      <button data-role="submit">Ask</button>
    </miso-query>
  </miso-ask>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient('...');
  await client.ui.ready;
  const workflow = client.ui.ask;
  workflow.useApi(false);
  workflow.autoQuery();
});
</script>
{% endraw %}
