import type { CommandRunner } from 'gunshi'
import type { definition } from '../../commands/studio/status.ts'
import { getWorkerLogPath, getWorkerStatus } from './background.ts'
import { createStudioOptions, run, status } from './run.ts'

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, async () => {
    const worker = await getWorkerStatus()
    console.log(`Background connection: ${worker.state}${worker.running ? ` (PID ${worker.pid})` : ''}`)
    console.log(`Logs: ${getWorkerLogPath()}`)
    await status(options)
  })
}
