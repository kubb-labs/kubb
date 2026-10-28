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

/**
 * The casing helpers one build shares. The driver creates a pair per `createKubb` and sets it on
 * every resolver as `this.camelCase` and `this.pascalCase`, so every plugin that cases the same
 * name hits one memo that is released with the build.
 */
export type Casing = {
  camelCase: typeof camelCase
  pascalCase: typeof pascalCase
  /** Empties the memo. The driver calls it on dispose, so a reused `Kubb` instance starts each build cold. */
  clear(): void
}

export function createCasing(): Casing {
  const cache = new Map<string, string>()
  const memo = (text: string, pascal: boolean): string => {
    const key = `${pascal ? 'P' : 'c'}${text}`
    let result = cache.get(key)
    if (result === undefined) {
      result = convert(text, pascal)
      cache.set(key, result)
    }
    return result
  }

  return {
    camelCase: (text, { prefix = '', suffix = '' } = {}) => memo(`${prefix} ${text} ${suffix}`, false),
    pascalCase: (text, { prefix = '', suffix = '' } = {}) => memo(`${prefix} ${text} ${suffix}`, true),
    clear: () => cache.clear(),
  }
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
  return convert(`${prefix} ${text} ${suffix}`, false)
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
  return convert(`${prefix} ${text} ${suffix}`, true)
}
