/**
 * Pure JavaScript fallback for the `@kubb/transformer` package.
 *
 * This module is used when the native NAPI-RS binary is not available
 * for the current platform.  The implementation is a direct port of the
 * TypeScript source in `internals/utils/src/casing.ts`,
 * `internals/utils/src/reserved.ts`, and `internals/utils/src/fs.ts`.
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

// ---------------------------------------------------------------------------
// Reserved-word transformation
// ---------------------------------------------------------------------------

/**
 * JavaScript and Java reserved words.
 * Using a `Set` for O(1) membership test (vs Array.includes() which is O(n)).
 *
 * @type {Set<string>}
 */
const _reservedWords = new Set([
  'abstract',
  'arguments',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
  'Array',
  'Date',
  'hasOwnProperty',
  'Infinity',
  'isFinite',
  'isNaN',
  'isPrototypeOf',
  'length',
  'Math',
  'name',
  'NaN',
  'Number',
  'Object',
  'prototype',
  'String',
  'toString',
  'undefined',
  'valueOf',
])

/**
 * Prefixes `word` with `_` when it is a reserved JavaScript/Java identifier
 * or starts with a digit (0–9).
 *
 * @param {string} word
 * @returns {string}
 *
 * @example
 * transformReservedWord('delete')  // '_delete'
 * transformReservedWord('1test')   // '_1test'
 * transformReservedWord('myVar')   // 'myVar'
 */
export function transformReservedWord(word) {
  if (!word) return word
  const firstChar = word.charCodeAt(0)
  if (_reservedWords.has(word) || (firstChar >= 48 && firstChar <= 57)) {
    return `_${word}`
  }
  return word
}

// ---------------------------------------------------------------------------
// Path utilities
// ---------------------------------------------------------------------------

/**
 * Converts all backslashes to forward slashes.
 * Extended-length Windows paths (`\\?\...`) are left unchanged.
 *
 * @param {string} p
 * @returns {string}
 */
function _toSlash(p) {
  if (p.startsWith('\\\\?\\')) return p
  return p.replaceAll('\\', '/')
}

/**
 * Computes `posix.relative(from, to)` using only forward-slash string ops.
 *
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
function _posixRelative(from, to) {
  const fromParts = from.split('/').filter(Boolean)
  const toParts = to.split('/').filter(Boolean)
  let common = 0
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common++
  }
  const upCount = fromParts.length - common
  const down = toParts.slice(common)
  return [...Array(upCount).fill('..'), ...down].join('/')
}

/**
 * Returns the relative path from `rootDir` to `filePath`, always using
 * forward slashes and prefixed with `./` when not already traversing upward.
 *
 * @param {string} rootDir
 * @param {string} filePath
 * @returns {string}
 *
 * @example
 * getRelativePath('/project/src', '/project/src/gen/types.ts')  // './gen/types.ts'
 * getRelativePath('/project/src/gen', '/project/src')            // './..'
 */
export function getRelativePath(rootDir, filePath) {
  if (!rootDir || !filePath) {
    throw new Error(`Root and file should be filled in when retrieving the relativePath, ${rootDir ?? ''} ${filePath ?? ''}`)
  }
  const relative = _posixRelative(_toSlash(rootDir), _toSlash(filePath))
  return relative.startsWith('../') ? relative : `./${relative}`
}
