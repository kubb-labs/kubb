import { memo } from './promise.ts'

type Options = {
  /** Text prepended before casing is applied. */
  prefix?: string
  /** Text appended before casing is applied. */
  suffix?: string
}

/**
 * Shared implementation for camelCase and PascalCase conversion.
 * Splits on common word boundaries (spaces, hyphens, underscores, dots, slashes, colons)
 * and capitalizes each word according to `pascal`.
 *
 * When `pascal` is `true` the first word is also capitalized (PascalCase), otherwise only subsequent words are.
 */
function convert(text: string, pascal: boolean): string {
  return (
    text
      .trim()
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      // A status range such as `2xx` stays one word.
      .replace(/(\d)(?!xx(?![a-z]))([a-z])/g, '$1 $2')
      .split(/[\s\-_./\\:]+/)
      .filter(Boolean)
      .map((word, i) => {
        if (word.length > 1 && word === word.toUpperCase()) return word
        const head = i === 0 && !pascal ? word.charAt(0).toLowerCase() : word.charAt(0).toUpperCase()
        return head + word.slice(1)
      })
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '')
  )
}

// Plugins case the same names on every visit. Clearing at the limit bounds a long-running host.
const cache = memo.create<string, string>({ max: 100_000 })

function toCamelOrPascal(text: string, pascal: boolean): string {
  const key = `${pascal ? 'P' : 'c'}${text}`
  return memo(cache, key, () => convert(text, pascal))
}

/**
 * Converts `text` to camelCase.
 *
 * @example Word boundaries
 * `camelCase('hello-world') // 'helloWorld'`
 *
 * @example With a prefix
 * `camelCase('tag', { prefix: 'create' }) // 'createTag'`
 */
export function camelCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, false)
}

/**
 * Converts `text` to PascalCase.
 *
 * @example Word boundaries
 * `pascalCase('hello-world') // 'HelloWorld'`
 *
 * @example With a suffix
 * `pascalCase('tag', { suffix: 'schema' }) // 'TagSchema'`
 */
export function pascalCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, true)
}

// A word starts at `petType`, `sensor2Reading`, and `HTTPResponse`, while `IDs` and `OAuth` stay whole
const wordStart = /(?<=[a-z\d])(?=[A-Z])|(?<=[A-Z]{2})(?=[A-Z][a-z]{2})/

// A segment without lowercase letters, such as `COOL` or `2D`, stays one word, so a snake_case name is left unchanged.
function words(text: string): Array<string> {
  return text
    .split(/[\s\-_./\\:]+/)
    .filter(Boolean)
    .flatMap((segment) => (segment === segment.toUpperCase() ? segment : segment.split(wordStart)))
}

/**
 * Uppercases only the first character of `text`. Unlike `pascalCase` it never splits words or strips characters.
 *
 * @example
 * `capitalize('getPetById') // 'GetPetById'`
 */
export function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}

/**
 * Converts `text` to snake_case.
 *
 * @example
 * `snakeCase('helloWorld') // 'hello_world'`
 */
export function snakeCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return words(`${prefix} ${text} ${suffix}`)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
    .filter(Boolean)
    .join('_')
}

/**
 * Converts `text` to SCREAMING_SNAKE_CASE.
 *
 * @example
 * `screamingSnakeCase('helloWorld') // 'HELLO_WORLD'`
 */
export function screamingSnakeCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return snakeCase(text, { prefix, suffix }).toUpperCase()
}
