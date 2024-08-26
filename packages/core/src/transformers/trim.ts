export function trim(text: string): string {
  return text.replaceAll(/\n/g, '').trim()
}

export function trimQuotes(text: string): string {
  if (text.match(/^"(.*)"$/)) {
    return text.replace(/^"(.*)"$/, '$1')
  }
  if (text.match(/^'(.*)'$/)) {
    return text.replace(/^'(.*)'$/, '$1')
  }

  if (text.match(/^`(.*)`$/)) {
    return text.replace(/^`(.*)`$/, '$1')
  }

  return text
}
