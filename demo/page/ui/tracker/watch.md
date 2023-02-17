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
  <miso-unit unit-id="unit-1">
    <ul id="list" class="list"></ul>
  </miso-unit>
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
});
document.querySelector('#clear-btn').addEventListener('click', () => {  
  document.querySelector('#list').innerHTML = '';
});
</script>
<script>
MisoClient.plugins.use('std:ui');
const client = new MisoClient('...');
client.units.get('unit-1').useTracker({ watch: true }).startTracker();
</script>
{% endraw %}
