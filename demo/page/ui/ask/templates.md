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
<h1 class="hero-title">Miso Ask</h1>
<div id="root" class="container">
  <h3>Root</h3>
  <div class="controls">
    <button type="button" class="btn btn-outline-secondary" id="copy-btn" data-role="copy-btn">Copy</button>
    <div class="spacing"></div>
    <div class="form-check form-switch">
      <input class="form-check-input" checked type="checkbox" id="root-prettified-check" data-role="prettified-check">
      <label class="form-check-label" for="root-prettified-check">Prettified</label>
    </div>
  </div>
  <div class="code"><code data-role="code"></code></div>
</div>
<div id="follow-up" class="container">
  <h3>Follow-up</h3>
  <div class="controls">
    <button type="button" class="btn btn-outline-secondary" id="copy-btn" data-role="copy-btn">Copy</button>
    <div class="spacing"></div>
    <div class="form-check form-switch">
      <input class="form-check-input" checked type="checkbox" id="follow-up-prettified-check" data-role="prettified-check">
      <label class="form-check-label" for="follow-up-prettified-check">Prettified</label>
    </div>
  </div>
  <div class="code"><code data-role="code"></code></div>
</div>
<script>
const { prettify, minify } = window.htmlfy;
class TemplateController {
  constructor(rootSelector, templateFn) {
    this._templateFn = templateFn;
    this._rootElement = document.querySelector(rootSelector);
    this._codeElement = this._rootElement.querySelector('[data-role="code"]');
    this._prettifiedCheckbox = this._rootElement.querySelector('[data-role="prettified-check"]');
    this._copyBtn = this._rootElement.querySelector('[data-role="copy-btn"]');
    this._copyBtn.addEventListener('click', this._copy.bind(this));
    this._prettifiedCheckbox.addEventListener('change', this._render.bind(this));
    const misocmd = window.misocmd || (window.misocmd = []);
    misocmd.push(this._render.bind(this));
  }
  _render() {
    const prettified = this._prettifiedCheckbox.checked;
    let html = this._templateFn();
    html = minify(html).trim();
    if (prettified) {
      html = prettify(html);
    }
    this._codeElement.textContent = html;
    console.log(html);
  }
  _copy() {
    const range = document.createRange();
    range.selectNode(this._codeElement);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  }
}
new TemplateController('#root', () => window.MisoClient.ui.defaults.ask.templates.root());
new TemplateController('#follow-up', () => window.MisoClient.ui.defaults.ask.templates.followUp({ parentQuestionId: '${parentQuestionId}' }));
</script>
{% endraw %}
