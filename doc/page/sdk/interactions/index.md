---
title: Interactions APIs
desc: Miso’s Interaction APIs let you manage your Interaction records stored with Miso.
---
### Events

{% for group in data.event.groups %}
#### {{ group.title }}
<table class="table">
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col">Name</th>
      <th scope="col">Description</th>
    </tr>
  </thead>
  <tbody>
  {%- for event in group.events -%}
    <tr>
      <td></td>
      <td><code>{{ event.name }}</code></td>
      <td>{{ event.desc | markdown | safe }}</td>
    </tr>
  {%- endfor -%}
  </tbody>
</table>
{% endfor %}
