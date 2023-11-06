export function trim(text: string): string {
  return text.replaceAll(/\n/g, '').trim()
}
