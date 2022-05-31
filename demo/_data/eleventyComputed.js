function chapter(data) {
  return urlSegment(data, 0);
}

function section(data) {
  return urlSegment(data, 1);
}

function urlSegment({ page }, index) {
  const pageUrl = page.url.substring(1);
  return (pageUrl && pageUrl.split('/')[index]) || undefined;
}

module.exports = {
  chapter: chapter,
  section: section
};
