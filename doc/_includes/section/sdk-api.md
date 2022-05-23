{% from 'macros.njk' import proptable %}

#### Payload
The `payload` parameter is an object with the following properties:

{{ proptable('sdk', api + '.payload') }}

#### Options
The `options` parameter is an optional object with the following properties:

{{ proptable('sdk', 'request.options') }}

See the [request options page]({{ '/sdk/request-options' | url }}) for more details.

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('sdk', api + '.response') }}
