/** Thrown when a plugin's configuration or input fails validation. */
export class ValidationPluginError extends Error {}

/**
 * Thrown when one or more errors occur during a Kubb build.
 * Carries the full list of underlying errors on `errors`.
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
 * When the value is already an `Error` it is returned as-is;
 * otherwise a new `Error` is created whose message is `String(value)`.
 */
export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

/**
 * Safely extracts a human-readable message from any thrown value.
 */
export function getErrorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}

/**
 * Extracts the `.cause` of an `Error` as an `Error | undefined`.
 * Returns `undefined` when the cause is absent or is not an `Error`.
 */
export function toCause(error: Error): Error | undefined {
  return error.cause instanceof Error ? error.cause : undefined
}
