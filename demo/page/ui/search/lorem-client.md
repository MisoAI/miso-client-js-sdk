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
</style>
<section>
  <div style="display: flex; gap: 1rem;">
    <miso-search style="flex-grow: 1;">
      <miso-query></miso-query>
    </miso-search>
    <div id="layout-radio-group" class="btn-group" role="group">
      <input type="radio" class="btn-check" name="layout" value="list" id="layout-radio-list" autocomplete="off" checked>
      <label class="btn btn-outline-primary" for="layout-radio-list">List</label>
      <input type="radio" class="btn-check" name="layout" value="cards" id="layout-radio-cards" autocomplete="off">
      <label class="btn btn-outline-primary" for="layout-radio-cards">Cards</label>
      <input type="radio" class="btn-check" name="layout" value="carousel" id="layout-radio-carousel" autocomplete="off">
      <label class="btn btn-outline-primary" for="layout-radio-carousel">Carousel</label>
    </div>
  </div>
</section>
<script>
  const radioGroup = document.querySelector('#layout-radio-group');
  radioGroup.addEventListener('change', event => {
    const value = window.selectedLayout = event.target.value;
    window.onSelectLayout && window.onSelectLayout(value);
  });
  for (const radio of radioGroup.querySelectorAll('input[type="radio"]')) {
    if (radio.checked) {
      window.selectedLayout = radio.value;
      break;
    }
  }
</script>
<hr>
<section>
  <miso-search>
    <miso-products></miso-products>
  </miso-search>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  await MisoClient.plugins.install('std:lorem');
  const client = new MisoClient({
    apiKey: '...',
  });
  const workflow = client.ui.search;
  workflow.useApi('search', { rows: 10 });
  window.onSelectLayout = value => workflow.useLayouts({ products: value });
  window.onSelectLayout(window.selectedLayout);
});
</script>
{% endraw %}
