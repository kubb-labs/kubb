export function getText(text?: string): string {
  return text ? text.replaceAll('`', '\\`') : ''
}
