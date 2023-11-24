import { camelCase as changeCaseCamel, camelCaseTransformMerge, pascalCase as changePascalCase, pascalCaseTransformMerge } from 'change-case'

export function camelCase(text: string): string {
  return changeCaseCamel(text, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
}

export function pascalCase(text: string): string {
  return changePascalCase(text, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: pascalCaseTransformMerge })
}
