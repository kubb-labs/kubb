import { camelCase as changeCamelCase, pascalCase as changePascalCase, pathCase as changePathCase } from 'change-case'

type Options = {
  /**
   * When set it will replace all `.` with `/`.
   */
  isFile?: boolean
}

export function camelCase(text: string, { isFile }: Options = {}): string {
  if (isFile) {
    const splitArray = text.split('.')
    return splitArray.map((item, i) => i === splitArray.length - 1 ? camelCase(item) : item).join('/')
  }

  return changeCamelCase(text, { delimiter: '', mergeAmbiguousCharacters: true })
}

export function pascalCase(text: string, { isFile }: Options = {}): string {
  if (isFile) {
    const splitArray = text.split('.')
    return splitArray.map((item, i) => i === splitArray.length - 1 ? pascalCase(item) : item).join('/')
  }

  return changePascalCase(text, { delimiter: '', mergeAmbiguousCharacters: true })
}

export function pathCase(text: string, { isFile }: Options = {}): string {
  if (isFile) {
    const splitArray = text.split('.')
    return splitArray.map((item, i) => i === splitArray.length - 1 ? pathCase(item) : item).join('/')
  }

  return changePathCase(text, { delimiter: '' })
}
