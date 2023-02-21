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
  <div id="widget-radio-group" class="btn-group" role="group">
    <input type="radio" class="btn-check" name="widget" value="list" id="widget-radio-list" autocomplete="off" checked>
    <label class="btn btn-outline-primary" for="widget-radio-list">List</label>
    <input type="radio" class="btn-check" name="widget" value="cards" id="widget-radio-cards" autocomplete="off">
    <label class="btn btn-outline-primary" for="widget-radio-cards">Cards</label>
  </div>
  <button id="reload-btn" type="button" class="btn btn-success">Reload</button>
</section>
<script>
  const radioGroup = document.querySelector('#widget-radio-group');
  radioGroup.addEventListener('change', event => {
    const value = window.selectedWidget = event.target.value;
    window.onSelectWidget && window.onSelectWidget(value);
  });
  for (const radio of radioGroup.querySelectorAll('input[type="radio"]')) {
    if (radio.checked) {
      window.selectedWidget = radio.value;
      break;
    }
  }
  document.querySelector('#reload-btn').addEventListener('click', () => { window.onReload && window.onReload(); });
</script>
<hr>
<section style="margin-right: 100px;">
  <h3>Recommendation Units</h3>
  <miso-unit>
  </miso-unit>
</section>
<script>
MisoClient.plugins.use('std:ui');
const client = new MisoClient('...');
const unit = client.units.get();
unit.useApi('user_to_products', { rows: 6 });
unit.useWidget(window.selectedWidget);
window.onReload = () => unit.reset().start();
window.onSelectWidget = value => unit.useWidget(value);
unit.on('event', ({ type, productIds }) => {
  const color = type === 'impression' ? 'primary' : type === 'viewable' ? 'success' : type === 'click' ? 'danger' : 'secondary';
  window.helpers.ui.alert(`[${type}] ${productIds.join(', ')}`, { color });
});
unit.start();
</script>
{% endraw %}
