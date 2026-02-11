---
dependency: 'markdown-npm'
---

{% raw %}
<style>
#main {
  padding: 1rem;
}
.groups {
  margin-top: 1rem;
}
.controls {
  position: sticky;
  top: 1rem;
  z-index: 1;
  width: fit-content;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  background-color: #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
.controls .input-group {
  width: auto;
}
.controls .input-group-text {
  background-color: transparent;
}
.controls .button {
  cursor: pointer;
}
#seed {
  font-family: monospace;
}
#result {
  font-weight: bold;
}
</style>
{% endraw %}

<div id="main">
  <div class="controls">
    <div class="input-group seed-info">
      <span class="input-group-text">Seed</span>
      <span class="input-group-text" id="seed">...</span>
      <span class="input-group-text button" id="copy-seed">{% icon "copy" %}</span>
      <span class="input-group-text button" id="seed-to-url">{% icon "arrow-up" %}</span>
    </div>
    <div class="input-group step-info">
      <span class="input-group-text">Step</span>
      <span class="input-group-text" id="step">0</span>
      <span class="input-group-text" id="result">...</span>
    </div>
  </div>
  <div class="groups">
    <div id="answer-element-actual" class="miso-markdown"></div>
    <div id="answer-element-expected" class="miso-markdown"></div>
    <div id="answer-html-actual"></div>
    <div id="answer-html-expected"></div>
  </div>
</div>

<script async src="{{ '/js/markdown-test.js' | url }}"></script>
