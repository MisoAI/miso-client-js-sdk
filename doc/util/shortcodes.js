const markdownIt = require('markdown-it');
const markdown = markdownIt({ html: true });

function propDesc(prop) {
  return markdown.render(`${prop.required ? '**[Required]** ' : ''}${prop.desc}`);
}

function propRow(prop) {
  return `<tr>
  <td><code>${prop.name}</code></td>
  <td>${prop.type}</td>
  <td>${propDesc(prop)}</td>
</tr>`;
}

function propTable(propGroups) {
  return function(key) {
    const group = propGroups[key];
    return `<table class="table">
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Type</th>
      <th scope="col">Description</th>
    </tr>
  </thead>
  <tbody>
  ${group.props.map(propRow).join('')}
  </tbody>
  </table>`;
  };
}

module.exports = {
  propTable: propTable
};
