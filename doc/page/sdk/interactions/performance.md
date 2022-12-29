---
title: Performance Tracking
---

{% from 'macros.njk' import proptable %}

When we introduce a UI unit of product recommendation in your website or application, it derives a typical conversion funnel:

<table class="miso-diagram">
  <tr>
    <td>
      <div class="box">
        API Request
      </div>
    </td>
    <td>
      <div style="min-width: 36px;"></div>
      <span class="line hor"></span>
      <span class="arrow right"></span>
    </td>
    <td>
      <div class="box">
        API Response
      </div>
    </td>
    <td>
      <div style="min-width: 36px;"></div>
      <span class="line hor"></span>
      <span class="arrow right"></span>
    </td>
    <td>
      <div class="box">
        Impression
      </div>
    </td>
    <td>
      <div style="min-width: 36px;"></div>
      <span class="line hor"></span>
      <span class="arrow right"></span>
    </td>
    <td>
      <div class="box">
        Viewable
      </div>
    </td>
    <td>
      <div style="min-width: 36px;"></div>
      <span class="line hor"></span>
      <span class="arrow right"></span>
    </td>
    <td>
      <div class="box">
        Click
      </div>
    </td>
  </tr>
</table>

* API
  * Request: an HTTP request is sent to Miso service asking for recommendation.
  * Response: the response received.
* Impression: content representing recommendation results is rendered on the page or downloaded to user device.
* Viewable impression: the user actually sees the content.
* Click: the user clicks through the product link.

We can derive a few metrics from these events:

* CTR (Clickthrough Rate) = Click / Impression
* VCTR (Viewable Clickthrough Rate) = Click / Viewable Impression
* View Rate = Viewable Impression / Impression

These metrics give us a picture of how well a recommendation unit perform. We hence encourage you to track the three key interaction events: `impression`, `viewable_impression`, and `click`, when you integrate Miso recommendation APIs.

### Impression

An `impression` event is conventionally defined by:

* In a web page, the content is inserted into the DOM tree (even if it's not in the viewport right away), or
* On a mobile device, the content is downloaded to the device.

Note that you don't need to strictly follow the standard definition, and you can make up your own definition depending on your needs.

To send an `impression` event with SDK:

```js
miso.api.interactions.upload({
  type: 'impression',
  product_ids: [...]
});
```

### Viewable Impression

A `viewable_impression` event is conventionally defined by:

* 50% of the content area lies in viewport for a continuous 1 second.

There are variations to both parameters in the industry. Again, you don't need to follow the standard and can have your own design to represent the viewable concept.

Miso SDK offers a helper function to meature viewable impression:

```js
// promise is resolved when element reaches viewable condition
await MisoClient.helpers.viewable(element, options);
```

The `options` parameter is an optional object with the following properties:

{{ proptable('helpers', 'viewable') }}

To send an `viewable_impression` event with SDK:

```js
miso.api.interactions.upload({
  type: 'viewable_impression',
  product_ids: [...]
});
```

### Click

To send an `click` event with SDK:

```js
miso.api.interactions.upload({
  type: 'click',
  product_ids: [...]
});
```
