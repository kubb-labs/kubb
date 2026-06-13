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
 * Splits `text` on `.` and applies `transformPart` to each segment.
 * The last segment receives `isLast = true`, all earlier segments receive `false`.
 * Segments are joined with `/` to form a file path.
 *
 * Only splits on dots followed by a letter so that version numbers
 * embedded in operationIds (e.g. `v2025.0`) are kept intact.
 *
 * Empty segments are filtered before joining. They arise when the text starts with
 * a dot followed immediately by a letter (e.g. `..Schema` splits into `['..', 'Schema']`
 * and `'..'` transforms to an empty string). Without this filter the join would produce
 * a leading `/`, which `path.resolve` would interpret as an absolute path, allowing
 * generated files to escape the configured output directory.
 */
function applyToFileParts(text: string, transformPart: (part: string, isLast: boolean) => string): string {
  const parts = text.split(/\.(?=[a-zA-Z])/)
  return parts
    .map((part, i) => transformPart(part, i === parts.length - 1))
    .filter(Boolean)
    .join('/')
}

/**
 * Shared body for {@link camelCase} and {@link pascalCase}.
 * In file mode a segment is PascalCased only when it is the last segment and `pascal` is `true`,
 * so camelCase keeps every segment camelCased while pascalCase capitalizes the final one.
 */
function convert(text: string, pascal: boolean, { isFile, prefix = '', suffix = '' }: Options): string {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) => convert(part, isLast && pascal, isLast ? { prefix, suffix } : {}))
  }

  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, pascal)
}

/**
 * Converts `text` to camelCase.
 * When `isFile` is `true`, dot-separated segments are each cased independently and joined with `/`.
 *
 * @example
 * camelCase('hello-world')                   // 'helloWorld'
 * camelCase('pet.petId', { isFile: true })   // 'pet/petId'
 */
export function camelCase(text: string, options: Options = {}): string {
  return convert(text, false, options)
}

/**
 * Converts `text` to PascalCase.
 * When `isFile` is `true`, the last dot-separated segment is PascalCased and earlier segments are camelCased.
 *
 * @example
 * pascalCase('hello-world')                  // 'HelloWorld'
 * pascalCase('pet.petId', { isFile: true })  // 'pet/PetId'
 */
export function pascalCase(text: string, options: Options = {}): string {
  return convert(text, true, options)
}
