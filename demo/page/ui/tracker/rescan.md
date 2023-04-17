---
---

{% raw %}
<style>
  .list {
    list-style: none;
    margin: 20px 0;
    padding: 0;
    width: 400px;
  }
  .item {
    height: 80px;
    margin: 20px 0;
    border: 1px solid #CCC;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    user-select: none;
  }
</style>
<section>
  <button id="populate-btn" type="button" class="btn btn-success">Populate</button>
  <button id="clear-btn" type="button" class="btn btn-danger">Clear</button>
</section>
<hr>
<section>
  <h3>Recommendation Units</h3>
  <miso-recommendation unit-id="unit-1">
    <miso-results>
      <ul id="list" class="list"></ul>
    </miso-results>
  </miso-recommendation>
</section>
<script>
let index = 1;
document.querySelector('#populate-btn').addEventListener('click', () => {
  let html = '';
  for (let i = 0; i < 4; i++) {
    const productId = `product-${index}`;
    html += `<li id="${productId}" class="item" data-miso-product-id="${productId}"><a href="#">Product ${index}</a></li>`;
    index++;
  }
  document.querySelector('#list').insertAdjacentHTML('beforeend', html);
  window.onPopulate && window.onPopulate();
});
document.querySelector('#clear-btn').addEventListener('click', () => {  
  document.querySelector('#list').innerHTML = '';
  window.onClear && window.onClear();
});
</script>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const unit = client.ui.recommendation.get('unit-1');
  window.helpers.unit.monitorEvents(unit);
  unit.startTracker();
  window.onPopulate = window.onClear = () => unit.notifyViewUpdate();
});
</script>
{% endraw %}
