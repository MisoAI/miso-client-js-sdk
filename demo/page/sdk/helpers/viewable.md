---
---

Scroll down to trigger viewable event of target element.

{% raw %}
<style>
  .block {
    margin: 20px;
    width: 400px;
    height: 1500px;
    border: 2px dotted #CCC;
  }
  #target {
    margin: 20px;
    width: 400px;
    height: 200px;
    border: 2px solid #CCC;
    text-align: center;
    line-height: 200px;
  }
</style>
<div>
  <div class="block">
  </div>
</div>
<div>
  <div id="target">
    Viewable Target
  </div>
</div>
<div>
  <div class="block">
  </div>
</div>
<div class="toast-container position-fixed bottom-0 end-0 p-3">
  <div id="toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
    <!--
    <div class="toast-header">
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    -->
    <div class="toast-body">
      Viewable triggered!
    </div>
  </div>
</div>
<script>
(async () => {
  const toast = document.querySelector('#toast');
  await MisoClient.helpers.viewable('#target');
  (new bootstrap.Toast(toast)).show();
})();
</script>
{% endraw %}
