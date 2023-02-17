---
---

Click mode: lenient = true

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
<hr>
<section>
  <h3>Recommendation Units</h3>
  <miso-unit unit-id="unit-1">
    <ul class="list">
      <li id="product-1" class="item" data-miso-product-id="product-1">
        <a href="#">Product 1</a>
      </li>
      <li id="product-2" class="item" data-miso-product-id="product-2">
        <a href="#">Product 2 (prevents default)</a>
      </li>
      <li id="product-3" class="item" data-miso-product-id="product-3">
        <span>Product 3</span>
      </li>
    </ul>
  </miso-unit>
</section>
<script>
document.querySelector('[data-miso-product-id="product-2"]').addEventListener('click', e => e.preventDefault());
</script>
<script>
MisoClient.plugins.use('std:ui');
const client = new MisoClient('...');
const trackerOptions = {
  click: {
    lenient: true,
  }
};
client.units.get('unit-1').useTracker(trackerOptions).startTracker();
</script>
{% endraw %}
