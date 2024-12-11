---
dependency: 'code'
---

{% raw %}
<style>
main .container {
  padding: 2rem;
}
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.spacing {
  flex: 1;
}
.code {
  margin-top: 1rem;
  padding: 1rem;
  white-space: pre;
  overflow-x: auto;
  border: 1px solid #ccc;
  background: #f8f8ff;
}
.form-switch * {
  cursor: pointer !important;
}
</style>
<h1 class="hero-title">Miso Hybrid Search</h1>
<div class="container">
  <h3>Root</h3>
  <div class="controls">
    <button type="button" class="btn btn-outline-secondary" id="copy-btn">Copy</button>
    <div class="spacing"></div>
    <div class="form-check form-switch">
      <input class="form-check-input" checked type="checkbox" id="answerbox-check">
      <label class="form-check-label" for="answerbox-check">Answer box</label>
    </div>
    <div class="form-check form-switch">
      <input class="form-check-input" checked type="checkbox" id="prettified-check">
      <label class="form-check-label" for="prettified-check">Prettified</label>
    </div>
  </div>
  <div class="code"><code id="root"></code></div>
</div>
<script>
const { prettify, minify } = window.htmlfy;
const codeElement = document.querySelector('#root');
const prettifiedCheckbox = document.querySelector('#prettified-check');
const answerboxCheckbox = document.querySelector('#answerbox-check');
function renderTemplates() {
  const answerBox = answerboxCheckbox.checked;
  const prettified = prettifiedCheckbox.checked;
  let html = window.MisoClient.ui.defaults.hybridSearch.templates.root({ answerBox });
  html = minify(html).trim();
  if (prettified) {
    html = prettify(html);
  }
  codeElement.textContent = html;
  console.log(html);
}
function copy() {
  const range = document.createRange();
  range.selectNode(codeElement);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
}
document.querySelector('#copy-btn').addEventListener('click', copy);
prettifiedCheckbox.addEventListener('change', renderTemplates);
answerboxCheckbox.addEventListener('change', renderTemplates);
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(renderTemplates);
</script>
{% endraw %}
