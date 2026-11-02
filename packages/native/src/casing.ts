import { convertCaseJs, convertCaseNative } from './convertCase.ts'

type Options = {
  /**
   * Text prepended before casing is applied.
   */
  prefix?: string
  /**
   * Text appended before casing is applied.
   */
  suffix?: string
}

const convert = convertCaseNative ?? convertCaseJs

// Plugins case the same names on every visit. Clearing at the limit bounds a long-running host.
const cache = new Map<string, string>()
const cacheLimit = 100_000

function toCamelOrPascal(text: string, pascal: boolean): string {
  const key = `${pascal ? 'P' : 'c'}${text}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const result = convert(text, pascal)
  if (cache.size >= cacheLimit) cache.clear()
  cache.set(key, result)
  return result
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
