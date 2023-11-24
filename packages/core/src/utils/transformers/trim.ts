export function trim(text: string): string {
  return text.replaceAll(/\n/g, '').trim()
}

export function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}
