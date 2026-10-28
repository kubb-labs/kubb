import { type MessagePort, parentPort } from 'node:worker_threads'
import { createKubb } from './createKubb.ts'
import { Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import { KubbDriver, type WorkerRequest, type WorkerResponse } from './KubbDriver.ts'
import type { KubbHooks, UserConfig } from './types.ts'

/**
 * Serves one generate worker thread: sets up a driver on `userConfig`, the same config the main
 * thread runs, and answers its requests on `port` until the main thread terminates the thread.
 * The entry the main thread's `workers.spawn` starts calls this with the config it loaded.
 *
 * @example
 * ```ts
 * import { workerData } from 'node:worker_threads'
 * import { runGenerateWorker } from '@kubb/core'
 *
 * await runGenerateWorker(await loadConfig(workerData.configPath))
 * ```
 */
export async function runGenerateWorker(userConfig: UserConfig, port: MessagePort | null = parentPort): Promise<void> {
  if (!port) throw new Error('runGenerateWorker must run inside a worker thread.')

  const { config } = createKubb(userConfig)
  const driver = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })
  await driver.setup()

  port.on('message', async (message: WorkerRequest) => {
    let response: WorkerResponse
    try {
      response = message.type === 'generate' ? await driver.generateRange(message) : await driver.emitRange(message)
    } catch (error) {
      response = { type: 'error', error: Diagnostics.from(error) }
    }
    port.postMessage(response)
  })
}
