---
---

{% raw %}
<style>
  .block {
    margin: 20px 0;
    width: 400px;
    height: 100vh;
    border: 2px dotted #CCC;
  }
  .target {
    margin: 20px;
    width: 400px;
    height: 200px;
    border: 2px solid #CCC;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    user-select: none;
  }
  .unit {
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
<div>
  <button id="populate-btn" type="button" class="btn btn-success">Populate</button>
  <button id="clear-btn" type="button" class="btn btn-danger">Clear</button>
</div>
<hr>
<div>
  <h3>Recommendation Unit</h3>
  <ul id="unit" class="unit" data-miso-unit-id="unit-1"></ul>
</div>
<script>
let index = 1;
document.querySelector('#populate-btn').addEventListener('click', () => {
  let html = '';
  for (let i = 0; i < 4; i++) {
    const productId = `product-${index}`;
    html += `<li id="${productId}" class="item" data-miso-product-id="${productId}"><a href="#">Product ${index}</a></li>`;
    index++;
  }
  document.querySelector('#unit').insertAdjacentHTML('beforeend', html);
});
document.querySelector('#clear-btn').addEventListener('click', () => {  
  document.querySelector('#unit').innerHTML = '';
});
</script>
<script>
MisoClient.plugins.use('std:units');
const client = new MisoClient('...');
const unitElement = document.querySelector('#unit');
const unit = client.units.get(unitElement);
unit.items.watch();
unit.tracker.start();
</script>
{% endraw %}
