import { ParallelPluginError } from '@kubb/core'
import PrettyError from 'pretty-error'

export const prettyError = new PrettyError()
  .skipPackage('commander')
  .skip(function (traceLine, lineNumber) {
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

export function renderErrors(error: Error | undefined, { prefixText, debug = false }: { prefixText?: string; debug?: boolean }): string {
  if (!error) {
    return ''
  }

  if (error instanceof ParallelPluginError) {
    return [prefixText, ...error.errors.map((e) => renderErrors(e, { debug }))].filter(Boolean).join('\n')
  }

  if (debug) {
    const errors = getErrorCauses([error])

    return [prefixText, ...errors].filter(Boolean).join('\n')
  }

  // skip when no debug is set
  prettyError.skipNodeFiles()
  prettyError.skip(function () {
    return true
  } as PrettyError.Callback)

  return [prefixText, prettyError.render(error.message)].filter(Boolean).join('\n')
}
