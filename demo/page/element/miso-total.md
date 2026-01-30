---
---

{% raw %}
<div class="btn-group mt-3">
  <button class="btn btn-outline-primary" onclick="setValue(0)">0</button>
  <button class="btn btn-outline-primary" onclick="setValue(1)">1</button>
  <button class="btn btn-outline-primary" onclick="setValue(100)">100</button>
</div>
<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo">
  <miso-hybrid-search>
    <miso-total></miso-total>
  </miso-hybrid-search>
</div>
<script>
let setValue;
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient('...');
  await client.ui.ready;
  const workflow = client.ui.hybridSearch;
  workflow.useApi(false);
  setValue = (value) => {
    const { session } = workflow;
    workflow.updateData({
      session,
      value: {
        total: value,
      },
    });
  };
  setValue(1);
});
</script>
{% endraw %}
