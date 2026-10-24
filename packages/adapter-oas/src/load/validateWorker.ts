import { parentPort, workerData } from 'node:worker_threads'
import { validate } from '@readme/openapi-parser'
import type { Document } from '../types.ts'

export type ValidationErrors = { errors: Array<{ message: string }>; additionalErrors: number }

export type WorkerResult = { valid: true } | ({ valid: false } & ValidationErrors) | { thrown: string }

// Started by `validateDocumentInWorker`. `workerData` is a structured clone, so `validate` can dereference it in place.
try {
  const result = await validate(workerData as Document, { validate: { errors: { colorize: false } } })
  parentPort?.postMessage(
    (result.valid
      ? { valid: true }
      : { valid: false, errors: result.errors.map(({ message }) => ({ message })), additionalErrors: result.additionalErrors }) satisfies WorkerResult,
  )
} catch (error) {
  parentPort?.postMessage({ thrown: error instanceof Error ? error.message : String(error) } satisfies WorkerResult)
}
