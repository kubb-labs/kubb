export function getEncodedText(text?: string): string {
  return text ? text.replaceAll('`', '\\`') : ''
}
