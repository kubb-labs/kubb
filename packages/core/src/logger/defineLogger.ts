import type { Logger, LogOptions, UserLogger } from './types.ts'

export function defineLogger<Options extends LogOptions = LogOptions>(logger: UserLogger<Options>): Logger<Options> {
  return {
    ...logger,
  }
}
