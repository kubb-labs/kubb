import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { buildTelemetryEvent, sendTelemetry } from '../../telemetry.ts'

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

type ValidateModule = typeof import('@kubb/adapter-oas')
type ValidateDependencies = {
  /**
   * Loads `@kubb/adapter-oas`. Injected so tests can substitute a mock.
   */
  loadValidateModule: () => Promise<ValidateModule>
}

/**
 * Dynamically loads `@kubb/adapter-oas` for OpenAPI validation.
 */
export function loadValidateModule(): Promise<ValidateModule> {
  return import('@kubb/adapter-oas') as Promise<ValidateModule>
}

/**
 * Validates an OpenAPI/Swagger file at `input` using `@kubb/adapter-oas`.
 * Exits the process with code 1 on validation failure or missing dependency.
 */
export async function run({ input, version }: ValidateOptions, dependencies: ValidateDependencies = { loadValidateModule }): Promise<void> {
  const hrStart = process.hrtime()
  try {
    const { adapterOas } = await dependencies.loadValidateModule()
    const adapter = adapterOas()
    if (!adapter.validate) {
      throw new Error('The loaded adapter does not support validation.')
    }
    await adapter.validate(input, { throwOnError: true })

    await sendTelemetry(
      buildTelemetryEvent({
        command: 'validate',
        kubbVersion: version,
        hrStart,
        status: 'success',
      }),
    )
    console.log('✅ Validation success')
  } catch (error) {
    await sendTelemetry(
      buildTelemetryEvent({
        command: 'validate',
        kubbVersion: version,
        hrStart,
        status: 'failed',
      }),
    )
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
    console.error(getErrorMessage(error))
    process.exit(1)
  }
}
