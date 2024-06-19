{% raw %}
<style>
#main {
  padding: 1rem;
}
#answer {
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
  <div id="search-control" class="input-group">
    <input id="input" type="text" class="form-control">
    <button id="submit" class="btn btn-outline-secondary" type="button">Ask</button>
  </div>
  <div id="answer"></div>
</div>
{% endraw %}
