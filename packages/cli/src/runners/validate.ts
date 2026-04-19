import process from 'node:process'
import { getErrorMessage } from '@internals/utils'
import { parseDocument, validateDocument } from '@kubb/adapter-oas'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type ValidateOptions = {
  input: string
  version: string
}

export async function runValidate({ input, version }: ValidateOptions): Promise<void> {
  const hrStart = process.hrtime()
  try {
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
    console.error('❌ Validation failed')
    console.error(getErrorMessage(error))
    process.exit(1)
  }
}
