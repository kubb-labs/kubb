import { trimQuotes } from './trim.ts'

export function stringify(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) {
    return '""'
  }

  return JSON.stringify(trimQuotes(value.toString()))
}

export function stringifyObject(value: Record<string, unknown>): string {
  const items = Object.entries(value)
    .map(([key, val]) => {
      if (val !== null && typeof val === 'object') {
        return `${key}: {
        ${stringifyObject(val as Record<string, unknown>)}
      }`
      }

      return `${key}: ${val}`
    })
    .filter(Boolean)

  return items.join(',\n')
}
