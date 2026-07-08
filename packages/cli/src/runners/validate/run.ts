import process from 'node:process'
import { styleText } from 'node:util'
import { toError } from '@internals/utils'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'

type ValidateOptions = {
  /**
   * Path or URL to the OpenAPI/Swagger file to validate.
   */
  input: string
  /**
   * Current `@kubb/cli` version string, used for the telemetry payload.
   */
  version: string
}

/**
 * Validates an OpenAPI/Swagger file at `input` using `@kubb/adapter-oas`.
 * Exits the process with code 1 on validation failure or missing dependency.
 */
export async function run({ input, version }: ValidateOptions): Promise<void> {
  const hrStart = process.hrtime()
  const report = (status: 'success' | 'failed') => sendTelemetry(buildTelemetryEvent({ command: 'validate', kubbVersion: version, hrStart, status }))

  try {
    const { adapterOas } = await import('@kubb/adapter-oas')

    const adapter = adapterOas()
    if (!adapter.validate) {
      throw new Error('The loaded adapter does not support validation.')
    }

    await adapter.validate(input, { throwOnError: true })
    await report('success')

    console.log('✅ Validation success')
  } catch (error) {
    await report('failed')
    if (error instanceof Error && /@kubb\/adapter-oas/.test(error.message)) {
      console.error(styleText('red', 'The @kubb/adapter-oas package is not installed.'))
      console.error('')
      console.error('Install it with:')
      console.error(styleText('cyan', '  npm install @kubb/adapter-oas'))
      console.error(styleText('cyan', '  # or'))
      console.error(styleText('cyan', '  pnpm install @kubb/adapter-oas'))
      console.error('')
    }
    console.error('❌ Validation failed')
    console.error(toError(error).message)

    process.exit(1)
  }
}
