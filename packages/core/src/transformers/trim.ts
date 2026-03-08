export function trim(text: string): string {
  return text.trim()
}

export function trimQuotes(text: string): string {
  if (text.length >= 2) {
    const first = text[0]
    const last = text[text.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === '`' && last === '`')) {
      return text.slice(1, -1)
    }
  }
  return text
}
