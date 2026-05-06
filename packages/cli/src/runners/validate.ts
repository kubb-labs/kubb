import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type ValidateOptions = {
  input: string
  version: string
}

type ValidateModule = typeof import('@kubb/adapter-oas')

export async function runValidate({ input, version }: ValidateOptions): Promise<void> {
  const hrStart = process.hrtime()
  try {
    const { parseDocument, validateDocument } = (await import('@kubb/adapter-oas')) as ValidateModule
    const document = await parseDocument(input)
    await validateDocument(document, { throwOnError: true })

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
