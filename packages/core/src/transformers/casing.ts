import { camelCase as changeCaseCamel, pascalCase as changePascalCase, pathCase as changePathCase } from 'change-case'

export function camelCase(text: string): string {
  return changeCaseCamel(text, { delimiter: '', mergeAmbiguousCharacters: true })
}

export function pascalCase(text: string): string {
  return changePascalCase(text, { delimiter: '', mergeAmbiguousCharacters: true })
}

export function pathCase(text: string, { mode = 'simple' }: { mode?: 'simple' } = {}): string {
  if (mode === 'simple') {
    return text.replaceAll('.', '/')
  }

  return changePathCase(text)
}
