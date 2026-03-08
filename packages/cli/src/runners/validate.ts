import process from 'node:process'
import type * as OasModule from '@kubb/oas'
import { getErrorMessage } from '../utils/errors.ts'
import { jiti } from '../utils/jiti.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type ValidateOptions = {
  input: string
  version: string
}

export async function runValidate({ input, version }: ValidateOptions): Promise<void> {
  let mod: typeof OasModule
  try {
    mod = (await jiti.import('@kubb/oas', { default: true })) as typeof OasModule
  } catch (_e) {
    console.error(`Import of '@kubb/oas' is required to do validation`)
    process.exit(1)
  }

  const { parse } = mod
  const hrStart = process.hrtime()
  try {
    const oas = await parse(input)
    await oas.validate()

    await sendTelemetry(buildTelemetryEvent({ command: 'validate', kubbVersion: version, hrStart, status: 'success' }))
    console.log('✅ Validation success')
  } catch (error) {
    await sendTelemetry(buildTelemetryEvent({ command: 'validate', kubbVersion: version, hrStart, status: 'failed' }))
    console.error('❌ Validation failed')
    console.error(getErrorMessage(error))
    process.exit(1)
  }
}
