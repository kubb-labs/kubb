import { camelCase as changeCaseCamel, pascalCase as changePascalCase } from 'change-case'

export function camelCase(text: string): string {
  return changeCaseCamel(text, { delimiter: '', mergeAmbiguousCharacters: true })
}

export function pascalCase(text: string): string {
  return changePascalCase(text, { delimiter: '', mergeAmbiguousCharacters: true })
}
