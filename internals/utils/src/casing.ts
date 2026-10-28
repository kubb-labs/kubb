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

/**
 * Shared implementation for camelCase and PascalCase conversion.
 * Splits on common word boundaries (spaces, hyphens, underscores, dots, slashes, colons)
 * and capitalizes each word according to `pascal`.
 *
 * When `pascal` is `true` the first word is also capitalized (PascalCase), otherwise only subsequent words are.
 */
function convert(text: string, pascal: boolean): string {
  return text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .split(/[\s\-_./\\:]+/)
    .filter(Boolean)
    .map((word, i) => {
      if (word.length > 1 && word === word.toUpperCase()) return word
      const head = i === 0 && !pascal ? word.charAt(0).toLowerCase() : word.charAt(0).toUpperCase()
      return head + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

// Plugins resolve the same names over and over (about 47,000 calls for a 1,000 schema spec), so
// results are kept for the whole build. A size cap wiped the memo mid-build on large specs, so the
// driver clears it per build instead, which bounds what a long-running process keeps.
const cache = new Map<string, string>()

/**
 * Drops every memoized casing result. The driver calls it when a build starts.
 */
export function clearCasingCache(): void {
  cache.clear()
}

function toCamelOrPascal(text: string, pascal: boolean): string {
  const key = `${pascal ? 'P' : 'c'}${text}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const result = convert(text, pascal)
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
