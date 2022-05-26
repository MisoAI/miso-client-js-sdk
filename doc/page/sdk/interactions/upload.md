---
title: Upload Interactions
---

#### Syntax
```js
miso.api.interactions.upload(event);
```

#### Parameters
The `event` parameter is an object with the properties depending on the event type:
<script>
  let table;
  function onSelectEventType(value) {
    table = table || document.querySelector('#event-props-table');
    table.setAttribute('data-event-type', value);
  }
</script>

<script>

</script>

{# TODO: find a better UI #}
<p>
  Select an event type:
</p>
<div id="event-types" class="clearfix">
  {% for group in data.event.groups %}
  <div class="btn-group-lite" role="group" aria-label="{{ group.title }}">
  {%- for event in group.events -%}
    <div class="labeled-input">
      <input type="radio" class="btn-check" name="event-type" id="event-type-{{ event.value }}" value="{{ event.value }}" autocomplete="off" onchange="onSelectEventType(this.value)">
      <label class="btn" for="event-type-{{ event.value }}"><code class="raw">{{ event.value }}</code></label>
    </div>
  {%- endfor -%}
  </div>
  {% endfor %}
</div>

<style>
  {% for group in data.event.groups -%}
  {%- for event in group.events -%}
  #event-props-table[data-event-type="{{ event.value }}"] tr[data-used-by-except~="{{ event.value }}"],
  {% endfor -%}
  {%- endfor -%}
  #event-props-table tr[data-used-by] {
    display: none;
  }
  {% for group in data.event.groups -%}
  {%- for event in group.events -%}
  #event-props-table[data-event-type="{{ event.value }}"] tr[data-used-by~="{{ event.value }}"],
  {% endfor -%}
  {%- endfor -%}
  tr {
    display: table-row;
  }
</style>

<table id="event-props-table" class="table">
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Type</th>
      <th scope="col">Description</th>
    </tr>
  </thead>
  <tbody>
  {%- for prop in data.event.props -%}
    <tr {% if prop.used_by -%}data-used-by="{{ prop.used_by.join(' ') }}"{%- endif %}{% if prop.used_by_except -%}data-used-by-except="{{ prop.used_by_except.join(' ') }}"{%- endif %}>
      <td><code>{{ prop.name }}</code></td>
      <td>{{ prop.type }}</td>
      <td>{%- if prop.required -%}{{ '**Required.** ' | markdown | safe }}{%- endif -%}{{ prop.desc | markdown | safe }}</td>
    </tr>
  {%- endfor -%}
  </tbody>
</table>

<script>
  // TODO: find a better way
  const radio = document.querySelector('#event-types input[type="radio"]');
  radio.checked = true;
  onSelectEventType(radio.value);
</script>

#### Return value
A `Promise` without value. In general you don't need to wait for the response.

#### Examples
```js
const event = {
  type: 'add_to_cart',
  product_ids: ['a001', 'a002'],
  quantities: [3, 5],
  user_id: '...'
};
miso.api.interactions.upload(event);
```

#### Learn more
For more information, see [REST API](https://api.askmiso.com/#operation/interaction_upload_api_v1_interactions_post).
