import _camelcase from 'camelcase'

type Options = {
  /**
   * When set it will replace all `.` with `/`.
   */
  isFile?: boolean
  prefix?: string
  suffix?: string
}

export function camelCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    const splitArray = text.split('.')
    return splitArray.map((item, i) => (i === splitArray.length - 1 ? camelCase(item, { prefix, suffix }) : camelCase(item))).join('/')
  }

  return _camelcase(`${prefix} ${text} ${suffix}`, { pascalCase: false, preserveConsecutiveUppercase: true }).replace(/[^a-zA-Z0-9]/g, '')
}

export function pascalCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    const splitArray = text.split('.')
    return splitArray.map((item, i) => (i === splitArray.length - 1 ? pascalCase(item, { prefix, suffix }) : camelCase(item))).join('/')
  }

  return _camelcase(`${prefix} ${text} ${suffix}`, { pascalCase: true, preserveConsecutiveUppercase: true }).replace(/[^a-zA-Z0-9]/g, '')
}

export function snakeCase(text: string, { prefix = '', suffix = '' }: Omit<Options, 'isFile'> = {}): string {
  const processed = `${prefix} ${text} ${suffix}`.trim()
  // Convert to lowercase and replace non-alphanumeric characters with underscores
  return processed
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/[\s\-.]+/g, '_') // spaces, hyphens, dots to underscores
    .replace(/[^a-zA-Z0-9_]/g, '') // remove other special chars
    .toLowerCase()
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_|_$/g, '') // trim underscores from start and end
}

export function screamingSnakeCase(text: string, { prefix = '', suffix = '' }: Omit<Options, 'isFile'> = {}): string {
  return snakeCase(text, { prefix, suffix }).toUpperCase()
}
