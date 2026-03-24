/** Thrown when a plugin's configuration or input fails validation.
 *
 * @example
 * ```ts
 * throw new ValidationPluginError('Invalid config: "output.path" is required')
 * ```
 */
export class ValidationPluginError extends Error {}

/**
 * Thrown when one or more errors occur during a Kubb build.
 * Carries the full list of underlying errors on `errors`.
 *
 * @example
 * ```ts
 * throw new BuildError('Build failed', { errors: [err1, err2] })
 * ```
 */
export class BuildError extends Error {
  errors: Array<Error>

  constructor(message: string, options: { cause?: Error; errors: Array<Error> }) {
    super(message, { cause: options.cause })
    this.name = 'BuildError'
    this.errors = options.errors
  }
}

/**
 * Coerces an unknown thrown value to an `Error` instance.
 * Returns the value as-is when it is already an `Error`; otherwise wraps it with `String(value)`.
 *
 * @example
 * ```ts
 * try { ... } catch(err) {
 *   throw new BuildError('Build failed', { cause: toError(err), errors: [] })
 * }
 * ```
 */
export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

/**
 * Extracts a human-readable message from any thrown value.
 *
 * @example
 * ```ts
 * getErrorMessage(new Error('oops')) // 'oops'
 * getErrorMessage('plain string')    // 'plain string'
 * ```
 */
export function getErrorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}

/**
 * Extracts the `.cause` of an `Error` as an `Error`, or `undefined` when absent or not an `Error`.
 *
 * @example
 * ```ts
 * const cause = toCause(buildError) // Error | undefined
 * ```
 */
export function toCause(error: Error): Error | undefined {
  return error.cause instanceof Error ? error.cause : undefined
}
