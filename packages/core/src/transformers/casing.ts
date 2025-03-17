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
