---
---

{% raw %}
<style>
main {
  padding: 1rem;
}
.btn-group * {
  box-shadow: none !important;
}
#reload-btn {
  margin-left: 0.5em;
}
</style>
<section>
  <div id="layout-radio-group" class="btn-group" role="group">
    <input type="radio" class="btn-check" name="layout" value="list" id="layout-radio-list" autocomplete="off" checked>
    <label class="btn btn-outline-primary" for="layout-radio-list">List</label>
    <input type="radio" class="btn-check" name="layout" value="cards" id="layout-radio-cards" autocomplete="off">
    <label class="btn btn-outline-primary" for="layout-radio-cards">Cards</label>
    <input type="radio" class="btn-check" name="layout" value="carousel" id="layout-radio-carousel" autocomplete="off">
    <label class="btn btn-outline-primary" for="layout-radio-carousel">Carousel</label>
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
    <miso-query></miso-query>
  </miso-search>
</section>
<section style="margin-top: 1rem;">
  <miso-search>
    <miso-products></miso-products>
  </miso-search>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const workflow = client.ui.search;
  workflow.useApi('search', { rows: 10 });
  workflow.useAutocomplete(true);
  window.onSelectLayout = value => workflow.useLayouts({ products: value });
  window.onSelectLayout(window.selectedLayout);
});
</script>
{% endraw %}
