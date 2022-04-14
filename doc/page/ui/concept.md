---
layout: base.njk
title: Miso UI's core concept
---

The UI plugin follows a simple data model driven paradigm.

<table class="miso-diagram">
  <tr>
    <td>
      <div class="box">
        Element
      </div>
    </td>
    <td>
      <div style="min-width: 36px;"></div>
      <span class="line hor"></span>
      <span class="arrow right"></span>
    </td>
    <td>
      <div class="box">
        Data Model
      </div>
    </td>
    <td>
      <div style="min-width: 36px;"></div>
      <span class="line hor"></span>
      <span class="arrow right"></span>
    </td>
    <td>
      <div class="box">
        SDK Client
      </div>
    </td>
  </tr>
</table>

### Element
A custom element is responsible for the following:
* Take various attributes.
* Create a data model if necessary and attach to it.
* Trigger data model's action via its API.
* Subscribe and respond to data model's events.

### Data Model
A data model manages the following:
* Find or wait for the first SDK client instance and connects to it.
* Accept action calls, request data from the client, keep responses in order, then emit data events.
