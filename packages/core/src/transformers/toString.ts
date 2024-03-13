import { trimQuotes } from './trim'

export function toString(text: string | number): string {
  return JSON.stringify(trimQuotes(text.toString()))
}
