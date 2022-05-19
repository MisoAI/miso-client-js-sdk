#### API Types

Possible `api` values and their corresponding data items are:

<table class="table">
  <colgroup>
    <col span="1" style="width: 25%;">
    <col span="1" style="width: 25%;">
    <col span="1">
  </colgroup>
  <thead>
    <tr>
      <th scope="col">Value</th>
      <th scope="col">API Method</th>
      <th scope="col">Data Item Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>user_to_products</code></td>
      <td><a href="{{ '/sdk/recommendation/user_to_products' | url }}">User To Products</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>user_to_attributes</code></td>
      <td><a href="{{ '/sdk/recommendation/user_to_attributes' | url }}">User To Attributes</a></td>
      <td>attribute</td>
    </tr>
    <tr>
      <td><code>user_to_trending</code></td>
      <td><a href="{{ '/sdk/recommendation/user_to_trending' | url }}">User To Trendings</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>product_to_products</code></td>
      <td><a href="{{ '/sdk/recommendation/product_to_products' | url }}">Products To Products</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>search</code></td>
      <td><a href="{{ '/sdk/search/search' | url }}">Search</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>autocomplete</code></td>
      <td><a href="{{ '/sdk/search/autocomplete' | url }}">Autocomplete</a></td>
      <td>completion</td>
    </tr>
    <tr>
      <td><code>custom</code></td>
      <td colspan="2">
        Determined by the <code>fetch</code> parameter. See <a href="{{ '/ui/recipe/custom-api' | url }}">Custom API</a> for an example.
      </td>
    </tr>
  </tbody>
</table>
