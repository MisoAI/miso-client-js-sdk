export function removeMarkdownIncompleteTableRow(markdown) {
  const lastLineIndex = markdown.lastIndexOf('\n');
  const lastLine = markdown.slice(lastLineIndex + 1).trim();
  if (lastLine.startsWith('|')) {
    return markdown.slice(0, lastLineIndex + 1);
  }
  return markdown;
}

export function escapeTildes(markdown) {
  return markdown.replaceAll('~', '\\~');
}

export function defaultProcessMarkdown(markdown) {
  markdown = removeMarkdownIncompleteTableRow(markdown);
  markdown = escapeTildes(markdown);
  return markdown;
}
