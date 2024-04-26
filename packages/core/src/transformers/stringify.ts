import { trimQuotes } from './trim'

export function stringify(value: string | number | undefined): string {
  if (value === undefined) {
    return '""'
  }

  return JSON.stringify(trimQuotes(value.toString()))
}

export function stringifyObject(value: object): string {
  const items = Object.entries(value)
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}: {
        ${stringifyObject(value)}
      }`
      }

      return `${key}: ${value}`
    })
    .filter(Boolean)

  return items.join(',\n')
}
