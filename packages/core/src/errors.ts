export class ValidationPluginError extends Error {}

export class BuildError extends Error {
  cause: Error | undefined
  errors: Array<Error>

  constructor(message: string, options: { cause?: Error; errors: Array<Error> }) {
    super(message, { cause: options.cause })

    this.name = 'BuildError'
    this.cause = options.cause
    this.errors = options.errors
  }
}
