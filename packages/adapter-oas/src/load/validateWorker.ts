import { parentPort, workerData } from 'node:worker_threads'
import type { Document } from '../types.ts'
import { validateSpec } from './validateSpec.ts'

// Started by `validateDocumentInWorker`. `workerData` is a structured clone, so `validate` can dereference it in place.
parentPort?.postMessage(await validateSpec(workerData as Document))
