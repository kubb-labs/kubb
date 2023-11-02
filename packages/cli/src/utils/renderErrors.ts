/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { LogLevel } from '@kubb/core/utils'

import PrettyError from 'pretty-error'

export const prettyError = new PrettyError()
  .skipPackage('commander')
  .skip(function callback(traceLine: any) {
    // exclude renderErrors.ts
    const pattern = new RegExp('renderErrors')

    const hasMatch = traceLine?.file?.match(pattern)

    if (typeof traceLine.packageName !== 'undefined' && hasMatch) {
      return true
    }
  } as PrettyError.Callback)
  .start()

function getErrorCauses(errors: Error[]): string[] {
  return errors
    .reduce((prev, error) => {
      const causedError = error?.cause as Error
      if (causedError) {
        prev = [...prev, ...getErrorCauses([causedError])]
      }
      prev = [...prev, prettyError.render(error)]

      return prev
    }, [] as string[])
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

  return errors.filter(Boolean).join('\n')
}
