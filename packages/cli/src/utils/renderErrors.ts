/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ParallelPluginError } from '@kubb/core'
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

export function renderErrors(error: Error | undefined, { prefixText, logLevel = LogLevel.silent }: { prefixText?: string; logLevel?: LogLevel }): string {
  if (!error) {
    return ''
  }

  if (error instanceof ParallelPluginError) {
    return [prefixText, ...error.errors.map((e) => renderErrors(e, { logLevel }))].filter(Boolean).join('\n')
  }

  if (logLevel === LogLevel.silent) {
    // skip when no debug is set
    prettyError.skipNodeFiles()
    prettyError.skip(function skip() {
      return true
    } as PrettyError.Callback)

    return [prefixText, prettyError.render(error)].filter(Boolean).join('\n')
  }

  const errors = getErrorCauses([error])

  return [prefixText, ...errors].filter(Boolean).join('\n')
}
