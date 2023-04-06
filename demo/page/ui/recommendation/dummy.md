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
  <div id="layout-radio-group" class="btn-group" role="group">
    <input type="radio" class="btn-check" name="layout" value="carousel" id="layout-radio-carousel" autocomplete="off" checked>
    <label class="btn btn-outline-primary" for="layout-radio-carousel">Carousel</label>
    <input type="radio" class="btn-check" name="layout" value="list" id="layout-radio-list" autocomplete="off">
    <label class="btn btn-outline-primary" for="layout-radio-list">List</label>
    <input type="radio" class="btn-check" name="layout" value="cards" id="layout-radio-cards" autocomplete="off">
    <label class="btn btn-outline-primary" for="layout-radio-cards">Cards</label>
  </div>
  <button id="reload-btn" type="button" class="btn btn-success">Reload</button>
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
  document.querySelector('#reload-btn').addEventListener('click', () => { window.onReload && window.onReload(); });
</script>
<hr>
<section>
  <miso-recommendation></miso-recommendation>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const unit = client.ui.recommendation.get();
  unit.useSource(window.helpers.api);
  unit.useApi('user_to_products', { rows: 6 });
  unit.useLayout(window.selectedLayout);
  window.onReload = () => unit.reset().start();
  window.onSelectLayout = value => unit.useLayout(value);
  //window.helpers.unit.monitorEvents(unit);
  unit.start();
});
</script>
{% endraw %}
