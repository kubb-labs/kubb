export class SummaryError extends Error {
  public summary: string[]

  constructor(message: string, options: { cause: Error; summary?: string[] }) {
    super(message, { cause: options.cause })

    this.name = 'SummaryError'
    this.summary = options.summary || []
  }
}
