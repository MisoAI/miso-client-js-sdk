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
.miso-citation-tooltip .title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-weight: 600;
  width: max-content;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.miso-citation-tooltip .date {
  display: block;
  margin-top: 0.5em;
}
</style>
<div id="main">
  <div>
    Seed: <span id="seed"></span>
    <svg xmlns="http://www.w3.org/2000/svg" id="seed-to-url" class="bi bi-arrow-up-square" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="cursor: pointer;"><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm8.5 9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707z"/></svg>
  </div>
  <div class="groups">
    <div id="answer-element-actual" class="miso-markdown"></div>
    <div id="answer-element-expected" class="miso-markdown"></div>
    <div id="answer-html-actual"></div>
    <div id="answer-html-expected"></div>
  </div>
</div>
{% endraw %}

<script async src="{{ '/js/markdown-test.js' | url }}"></script>
