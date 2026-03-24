type Options = {
  /**
   * When `true`, dot-separated segments are split on `.` and joined with `/` after casing.
   */
  isFile?: boolean
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
function toCamelOrPascal(text: string, pascal: boolean): string {
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
 * The last segment receives `isLast = true`, all earlier segments receive `false`.
 * Segments are joined with `/` to form a file path.
 *
 * Only splits on dots followed by a letter so that version numbers
 * embedded in operationIds (e.g. `v2025.0`) are kept intact.
 */
function applyToFileParts(text: string, transformPart: (part: string, isLast: boolean) => string): string {
  const parts = text.split(/\.(?=[a-zA-Z])/)
  return parts.map((part, i) => transformPart(part, i === parts.length - 1)).join('/')
}

/**
 * Converts `text` to camelCase.
 * When `isFile` is `true`, dot-separated segments are each cased independently and joined with `/`.
 *
 * @example
 * camelCase('hello-world')                   // 'helloWorld'
 * camelCase('pet.petId', { isFile: true })   // 'pet/petId'
 */
export function camelCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) => camelCase(part, isLast ? { prefix, suffix } : {}))
  }

  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, false)
}

/**
 * Converts `text` to PascalCase.
 * When `isFile` is `true`, the last dot-separated segment is PascalCased and earlier segments are camelCased.
 *
 * @example
 * pascalCase('hello-world')                  // 'HelloWorld'
 * pascalCase('pet.petId', { isFile: true })  // 'pet/PetId'
 */
export function pascalCase(text: string, { isFile, prefix = '', suffix = '' }: Options = {}): string {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) => (isLast ? pascalCase(part, { prefix, suffix }) : camelCase(part)))
  }

  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, true)
}

/**
 * Converts `text` to snake_case.
 *
 * @example
 * snakeCase('helloWorld')  // 'hello_world'
 * snakeCase('Hello-World') // 'hello_world'
 */
export function snakeCase(text: string, { prefix = '', suffix = '' }: Omit<Options, 'isFile'> = {}): string {
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
 * @example
 * screamingSnakeCase('helloWorld') // 'HELLO_WORLD'
 */
export function screamingSnakeCase(text: string, { prefix = '', suffix = '' }: Omit<Options, 'isFile'> = {}): string {
  return snakeCase(text, { prefix, suffix }).toUpperCase()
}
