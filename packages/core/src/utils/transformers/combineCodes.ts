export function combineCodes(codes: string[]): string {
  return codes.map((code) => code.replaceAll(/(^[ \t]*\n)/gm, '')).join('\n')
}
