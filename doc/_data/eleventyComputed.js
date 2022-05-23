function section(data) {
  const pageUrl = data.page.url.substring(1);
  return (pageUrl && pageUrl.split('/')[1]) || undefined;
}

module.exports = {
  section: section
};
