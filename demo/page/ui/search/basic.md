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
    <miso-results></miso-results>
  </miso-search>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const search = client.ui.search;
  search.useApi('search', { rows: 10 });
  search.useLayout(window.selectedLayout);
  window.onSelectLayout = value => search.useLayout(value);
});
</script>
{% endraw %}
