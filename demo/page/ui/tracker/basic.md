---
---

Scroll down to see the recommendation unit.

{% raw %}
<style>
  .block {
    margin: 20px 0;
    width: 400px;
    height: 100vh;
    border: 2px dotted #CCC;
  }
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
  <div class="block">
  </div>
</section>
<section>
  <h3>Recommendation Units</h3>
  <miso-recommendation unit-id="unit-1">
    <ul class="list">
      <li id="product-1" class="item" data-miso-product-id="product-1">
        <a href="#">Product 1</a>
      </li>
      <li id="product-2" class="item" data-miso-product-id="product-2">
        <a href="#">Product 2</a>
      </li>
      <li id="product-3" class="item" data-miso-product-id="product-3">
        <a href="#">Product 3</a>
      </li>
      <li id="product-4" class="item" data-miso-product-id="product-4">
        <a href="#">Product 4 (prevent default)</a>
      </li>
    </ul>
  </miso-recommendation>
</section>
<script>
document.querySelector('[data-miso-product-id="product-4"]').addEventListener('click', e => e.preventDefault());
</script>
<script>
MisoClient.plugins.use('std:ui');
const client = new MisoClient('...');
const unit = client.ui.recommendation.get('unit-1');
window.helpers.unit.monitorEvents(unit);
unit.startTracker();
</script>
{% endraw %}
