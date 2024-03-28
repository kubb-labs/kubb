import { camelCase as changeCamelCase, pascalCase as changePascalCase, pathCase as changePathCase } from 'change-case'

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

  return changeCamelCase(`${prefix} ${text} ${suffix}`, {
    delimiter: '',
    mergeAmbiguousCharacters: true,
  })
}

export function pascalCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    const splitArray = text.split('.')
    return splitArray.map((item, i) => (i === splitArray.length - 1 ? pascalCase(item, { prefix, suffix }) : camelCase(item))).join('/')
  }

  return changePascalCase(`${prefix} ${text} ${suffix}`, {
    delimiter: '',
    mergeAmbiguousCharacters: true,
  })
}

export function pathCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    const splitArray = text.split('.')
    return splitArray.map((item, i) => (i === splitArray.length - 1 ? pathCase(item, { prefix, suffix }) : camelCase(item))).join('/')
  }

  return changePathCase(`${prefix} ${text} ${suffix}`, { delimiter: '' })
}
