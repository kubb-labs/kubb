/**
 * Options accepted by `camelCase` and `pascalCase`.
 */
export interface CaseOptions {
  /**
   * When `true`, dot-separated segments are split on `.` and joined with `/`
   * after casing is applied, producing a file-path-style output.
   *
   * @example
   * camelCase('pet.petId', { isFile: true })  // 'pet/petId'
   */
  isFile?: boolean
  /** Text prepended before casing is applied. */
  prefix?: string
  /** Text appended before casing is applied. */
  suffix?: string
}

/**
 * Options accepted by `snakeCase` and `screamingSnakeCase`.
 */
export interface SnakeCaseOptions {
  /** Text prepended before casing is applied. */
  prefix?: string
  /** Text appended before casing is applied. */
  suffix?: string
}

/**
 * Converts `text` to camelCase.
 *
 * Uses the native NAPI-RS binary when available; falls back to a pure
 * JavaScript implementation on unsupported platforms.
 *
 * When `isFile` is `true`, dot-separated segments are each cased
 * independently and joined with `/`.
 *
 * @example
 * camelCase('hello-world')                   // 'helloWorld'
 * camelCase('is HTML test')                  // 'isHTMLTest'
 * camelCase('pet.petId', { isFile: true })   // 'pet/petId'
 */
export declare function camelCase(text: string, options?: CaseOptions): string

/**
 * Converts `text` to PascalCase.
 *
 * Uses the native NAPI-RS binary when available; falls back to a pure
 * JavaScript implementation on unsupported platforms.
 *
 * When `isFile` is `true`, the last dot-separated segment is PascalCased
 * and earlier segments are camelCased.
 *
 * @example
 * pascalCase('hello-world')                  // 'HelloWorld'
 * pascalCase('is HTML test')                 // 'IsHTMLTest'
 * pascalCase('pet.petId', { isFile: true })  // 'pet/PetId'
 */
export declare function pascalCase(text: string, options?: CaseOptions): string

/**
 * Converts `text` to snake_case.
 *
 * Uses the native NAPI-RS binary when available; falls back to a pure
 * JavaScript implementation on unsupported platforms.
 *
 * @example
 * snakeCase('helloWorld')  // 'hello_world'
 * snakeCase('Hello-World') // 'hello_world'
 */
export declare function snakeCase(text: string, options?: SnakeCaseOptions): string

/**
 * Converts `text` to SCREAMING_SNAKE_CASE.
 *
 * Uses the native NAPI-RS binary when available; falls back to a pure
 * JavaScript implementation on unsupported platforms.
 *
 * @example
 * screamingSnakeCase('helloWorld')  // 'HELLO_WORLD'
 */
export declare function screamingSnakeCase(text: string, options?: SnakeCaseOptions): string

/**
 * Prefixes `word` with `_` when it is a reserved JavaScript/Java identifier
 * or starts with a digit (0–9).
 *
 * The native binary uses an O(1) hash-set lookup; the JavaScript fallback
 * also uses a `Set` for O(1) lookups (the original `internals/utils/reserved.ts`
 * uses `Array.includes()` which is O(n)).
 *
 * @example
 * transformReservedWord('delete')  // '_delete'
 * transformReservedWord('1test')   // '_1test'
 * transformReservedWord('myVar')   // 'myVar'
 */
export declare function transformReservedWord(word: string): string

/**
 * Returns the relative path from `rootDir` to `filePath`, always using
 * forward slashes and prefixed with `./` when not already traversing upward.
 *
 * Mirrors the behaviour of `getRelativePath` in `internals/utils/src/fs.ts`
 * and handles Windows-style backslash paths.
 *
 * @throws When either argument is empty or nullish.
 *
 * @example
 * getRelativePath('/project/src', '/project/src/gen/types.ts')  // './gen/types.ts'
 * getRelativePath('/project/src/gen', '/project/src')            // './..'
 */
export declare function getRelativePath(rootDir: string, filePath: string): string
