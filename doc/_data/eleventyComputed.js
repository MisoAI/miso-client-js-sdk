function region(data) {
  return urlSegment(data, 0);
}

function section(data) {
  return urlSegment(data, 1);
}

function urlSegment(data, index) {
  const pageUrl = data.page.url.substring(1);
  return (pageUrl && pageUrl.split('/')[index]) || undefined;
}

module.exports = {
  region: region,
  section: section
};
