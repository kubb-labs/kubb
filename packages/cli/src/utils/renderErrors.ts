/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { LogLevel } from '@kubb/core/logger'

import PrettyError from 'pretty-error'

export const prettyError = new PrettyError()
  .skipPackage('commander')
  .skip(function callback(traceLine: any) {
    // exclude renderErrors.ts
    const pattern = /renderErrors/

    const hasMatch = traceLine?.file?.match(pattern)

    if (typeof traceLine.packageName !== 'undefined' && hasMatch) {
      return true
    }
  } as PrettyError.Callback)
  .start()

function getErrorCauses(errors: Error[]): Error[] {
  return errors
    .reduce((prev, error) => {
      const causedError = error?.cause as Error
      if (causedError) {
        prev = [...prev, ...getErrorCauses([causedError])]
        return prev
      }
      prev = [...prev, error]

      return prev
    }, [] as Error[])
    .filter(Boolean)
}

export function renderErrors(error: Error | undefined, { logLevel = LogLevel.silent }: { logLevel?: LogLevel }): string {
  if (!error) {
    return ''
  }

  if (logLevel === LogLevel.silent) {
    // skip when no debug is set
    prettyError.skipNodeFiles()
    prettyError.skip(function skip() {
      return true
    } as PrettyError.Callback)

    return [prettyError.render(error)].filter(Boolean).join('\n')
  }

  const errors = getErrorCauses([error])

  if (logLevel === LogLevel.debug) {
    console.log(errors)
  }

  return errors
    .filter(Boolean)
    .map((error) => prettyError.render(error))
    .join('\n')
}
