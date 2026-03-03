/** Shell-like tokenizer: splits a command string respecting single/double quotes. */
export function tokenize(command: string): string[] {
  const args: string[] = []
  let current = ''
  let quote = ''
  for (const ch of command) {
    if (quote) {
      if (ch === quote) quote = ''
      else current += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === ' ' || ch === '\t') {
      if (current) {
        args.push(current)
        current = ''
      }
    } else {
      current += ch
    }
  }
  if (current) args.push(current)
  return args
}
