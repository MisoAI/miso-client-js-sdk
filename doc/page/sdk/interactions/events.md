---
title: Interaction Events
---

### Events

{% for group in data.event.groups %}
#### {{ group.title }}
<table class="table">
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col">Name</th>
      <th scope="col">Definition</th>
    </tr>
  </thead>
  <tbody>
  {%- for event in group.events -%}
    <tr>
      <td><span class="symbol"{% if (event.tier > 1) %} style="visibility: hidden;"{% endif %}>&#9734;</span></td>
      <td><code>{{ event.value }}</code></td>
      <td>{{ event.desc | markdown | safe }}</td>
    </tr>
  {%- endfor -%}
  </tbody>
</table>
{% endfor %}
