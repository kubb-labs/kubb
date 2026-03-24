import type { Logger, LoggerOptions, UserLogger } from './types.ts'

export function defineLogger<Options extends LoggerOptions = LoggerOptions>(logger: UserLogger<Options>): Logger<Options> {
  return {
    ...logger,
  }
}
