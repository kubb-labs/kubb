type Options = {
  /**
   * When set it will replace all `.` with `/`.
   */
  isFile?: boolean
  prefix?: string
  suffix?: string
}

function toCamelOrPascal(text: string, pascal: boolean): string {
  const normalized = text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')

  const words = normalized.split(/[\s\-_./\\:]+/).filter(Boolean)

  return words
    .map((word, i) => {
      const allUpper = word.length > 1 && word === word.toUpperCase()
      if (allUpper) return word
      if (i === 0 && !pascal) return word[0]!.toLowerCase() + word.slice(1)
      return word[0]!.toUpperCase() + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

function applyToFileParts(text: string, transformPart: (part: string, isLast: boolean) => string): string {
  const parts = text.split('.')
  const last = parts.length - 1
  return parts.map((part, i) => transformPart(part, i === last)).join('/')
}

export function camelCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) => camelCase(part, isLast ? { prefix, suffix } : {}))
  }

  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, false)
}

export function pascalCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) => (isLast ? pascalCase(part, { prefix, suffix }) : camelCase(part)))
  }

  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, true)
}

export function snakeCase(text: string, { prefix = '', suffix = '' }: Omit<Options, 'isFile'> = {}): string {
  const processed = `${prefix} ${text} ${suffix}`.trim()
  // Convert to lowercase and replace non-alphanumeric characters with underscores
  return processed
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/[\s\-.]+/g, '_') // spaces, hyphens, dots to underscores
    .replace(/[^a-zA-Z0-9_]/g, '') // remove other special chars
    .toLowerCase()
    .split('_')
    .filter(Boolean) // collapses runs of underscores and trims leading/trailing ones
    .join('_')
}

export function screamingSnakeCase(text: string, { prefix = '', suffix = '' }: Omit<Options, 'isFile'> = {}): string {
  return snakeCase(text, { prefix, suffix }).toUpperCase()
}
