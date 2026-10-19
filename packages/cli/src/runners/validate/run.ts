import process from 'node:process'
import { styleText } from 'node:util'
import { toError } from '@internals/utils'
import { trackRun } from '../../Telemetry.ts'
import { logCommandSummary } from '../../loggers/output.ts'

type ValidateOptions = {
  /**
   * Path or URL to the OpenAPI/Swagger file to validate.
   */
  input: string
}

/**
 * Validates an OpenAPI/Swagger file at `input` using `@kubb/adapter-oas`.
 * Exits the process with code 1 on validation failure or missing dependency.
 */
export async function run({ input }: ValidateOptions): Promise<void> {
  const hrStart = process.hrtime()
  const report = trackRun({ command: 'validate', hrStart })

  try {
    const { adapterOas } = await import('@kubb/adapter-oas')

    await adapterOas().validate(input, { throwOnError: true })
    await report({ status: 'success' })

    logCommandSummary({
      title: 'Validation passed',
      status: 'success',
      hrStart,
      lines: [
        `  ${styleText('bold', '1 specification validated')}`,
        `  ${styleText('dim', 'Input')}    ${styleText('cyan', input)}`,
        `  ${styleText('dim', 'Adapter')}  @kubb/adapter-oas`,
      ],
    })
  } catch (error) {
    await report({ status: 'failed' })
    const message = toError(error).message
    const missingAdapter = /(?:Cannot find|Cannot resolve|not found)[\s\S]*@kubb\/adapter-oas/.test(message)
    logCommandSummary({
      title: missingAdapter ? 'Could not validate' : 'Validation failed',
      status: 'failed',
      hrStart,
      lines: [
        `  ${styleText('dim', 'Input')}    ${styleText('cyan', input)}`,
        `  ${styleText('dim', 'Adapter')}  @kubb/adapter-oas${missingAdapter ? ' · not installed' : ''}`,
        '',
        styleText('bold', missingAdapter ? 'Required package' : 'Validation error'),
        `  ${styleText('red', message)}`,
        ...(missingAdapter
          ? ['', 'Install it with:', styleText('cyan', '  npm install @kubb/adapter-oas'), styleText('cyan', '  pnpm add @kubb/adapter-oas')]
          : []),
      ],
    })

    process.exit(1)
  }
}
