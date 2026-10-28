import { workerData } from 'node:worker_threads'
import { runGenerateWorker } from '@kubb/core'
import { getConfigs } from '../../config.ts'

/**
 * What `kubb generate` hands a worker thread: how it loaded the config and which entry it runs.
 */
export type GenerateWorkerData = {
  configPath?: string
  input?: string
  watch?: boolean
  logLevel?: 'silent' | 'info' | 'verbose'
  /** Index of the config entry in the loaded config file. */
  index: number
}

const { configPath, input, watch, logLevel, index } = workerData as GenerateWorkerData
const { configs } = await getConfigs({ configPath, input, watch, logLevel })
const config = configs[index]!

// The same override `generate` applies on the main thread, so banners name the same source.
await runGenerateWorker({ ...config, input: input ?? config.input })
