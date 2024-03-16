import { trimQuotes } from './trim'

export function stringify(text: string | number | undefined): string {
  if (!text) {
    return '""'
  }
  return JSON.stringify(trimQuotes(text.toString()))
}
