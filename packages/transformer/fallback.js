/**
 * Pure JavaScript fallback for the `@kubb/transformer` package.
 *
 * This module is used when the native NAPI-RS binary is not available
 * for the current platform.  The implementation is a direct port of the
 * TypeScript source in `internals/utils/src/casing.ts`.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Shared implementation for camelCase and PascalCase conversion.
 * Splits on common word boundaries and capitalises each word according to `pascal`.
 *
 * @param {string} text
 * @param {boolean} pascal
 * @returns {string}
 */
function toCamelOrPascal(text, pascal) {
  const normalized = text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')

  const words = normalized.split(/[\s\-_./\\:]+/).filter(Boolean)

  return words
    .map((word, i) => {
      const allUpper = word.length > 1 && word === word.toUpperCase()
      if (allUpper) return word
      if (i === 0 && !pascal) return word.charAt(0).toLowerCase() + word.slice(1)
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Splits `text` on `.` and applies `transformPart` to each segment.
 * The last segment receives `isLast = true`, all earlier segments `false`.
 * Segments are joined with `/`.
 *
 * @param {string} text
 * @param {(part: string, isLast: boolean) => string} transformPart
 * @returns {string}
 */
function applyToFileParts(text, transformPart) {
  const parts = text.split('.')
  return parts.map((part, i) => transformPart(part, i === parts.length - 1)).join('/')
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Converts `text` to camelCase.
 * When `isFile` is `true`, dot-separated segments are each cased independently
 * and joined with `/`.
 *
 * @param {string} text
 * @param {{ isFile?: boolean; prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * camelCase('hello-world')                   // 'helloWorld'
 * camelCase('pet.petId', { isFile: true })   // 'pet/petId'
 */
export function camelCase(text, { isFile, prefix = '', suffix = '' } = {}) {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) => camelCase(part, isLast ? { prefix, suffix } : {}))
  }
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, false)
}

/**
 * Converts `text` to PascalCase.
 * When `isFile` is `true`, the last dot-separated segment is PascalCased
 * and earlier segments are camelCased.
 *
 * @param {string} text
 * @param {{ isFile?: boolean; prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * pascalCase('hello-world')                  // 'HelloWorld'
 * pascalCase('pet.petId', { isFile: true })  // 'pet/PetId'
 */
export function pascalCase(text, { isFile, prefix = '', suffix = '' } = {}) {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) => (isLast ? pascalCase(part, { prefix, suffix }) : camelCase(part)))
  }
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, true)
}

/**
 * Converts `text` to snake_case.
 *
 * @param {string} text
 * @param {{ prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * snakeCase('helloWorld')  // 'hello_world'
 * snakeCase('Hello-World') // 'hello_world'
 */
export function snakeCase(text, { prefix = '', suffix = '' } = {}) {
  const processed = `${prefix} ${text} ${suffix}`.trim()
  return processed
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-.]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .join('_')
}

/**
 * Converts `text` to SCREAMING_SNAKE_CASE.
 *
 * @param {string} text
 * @param {{ prefix?: string; suffix?: string }} [options]
 * @returns {string}
 *
 * @example
 * screamingSnakeCase('helloWorld') // 'HELLO_WORLD'
 */
export function screamingSnakeCase(text, { prefix = '', suffix = '' } = {}) {
  return snakeCase(text, { prefix, suffix }).toUpperCase()
}
