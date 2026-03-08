export function trim(text: string): string {
  return text.trim()
}

export function trimQuotes(text: string): string {
  return text
    .replace(/^"(.*)"$/, '$1')
    .replace(/^'(.*)'$/, '$1')
    .replace(/^`(.*)`$/, '$1')
}
