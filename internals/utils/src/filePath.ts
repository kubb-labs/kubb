import { camelCase } from './casing.ts'

/**
 * Builds a nested file path from a dotted name. Splits on dots that precede a letter
 * (so version numbers embedded in operationIds like `v2025.0` stay intact), camelCases
 * every earlier segment, applies `caseLast` to the final segment, and joins with `/`.
 *
 * Empty segments are dropped before joining. They arise when the name starts with a dot
 * followed by a letter (e.g. `..Schema` splits into `['..', 'Schema']` and `'..'` cases to
 * an empty string). Without this a leading `/` would form, which `path.resolve` reads as an
 * absolute path, letting generated files escape the configured output directory.
 *
 * @example Nested path from a dotted name
 * `toFilePath('pet.petId') // 'pet/petId'`
 *
 * @example PascalCase the final segment
 * `toFilePath('pet.Pet', pascalCase) // 'pet/Pet'`
 *
 * @example Suffix applied to the final segment only
 * `toFilePath('tag.tag', (part) => camelCase(part, { suffix: 'schema' })) // 'tag/tagSchema'`
 */
export function toFilePath(name: string, caseLast: (part: string) => string = camelCase): string {
  const parts = name.split(/\.(?=[a-zA-Z])/)
  return parts
    .map((part, i) => (i === parts.length - 1 ? caseLast(part) : camelCase(part)))
    .filter(Boolean)
    .join('/')
}
