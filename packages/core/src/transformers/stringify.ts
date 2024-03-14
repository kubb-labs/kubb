import { trimQuotes } from './trim'

export function stringify(text: string | number): string {
  return JSON.stringify(trimQuotes(text.toString()))
}
