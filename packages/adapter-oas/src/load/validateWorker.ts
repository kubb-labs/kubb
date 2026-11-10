import { parentPort, workerData } from 'node:worker_threads'
import { validate } from '@readme/openapi-parser'
import { isOpenApi32 } from '../oas.ts'
import type { Document } from '../types.ts'
import { validateOpenApi32 } from './validate32.ts'

export type ValidationErrors = { errors: Array<{ message: string }>; additionalErrors: number }

export type WorkerResult = { valid: true } | ({ valid: false } & ValidationErrors) | { thrown: string }

async function run(document: Document): Promise<WorkerResult> {
  if (isOpenApi32(document)) return validateOpenApi32(document)
  const result = await validate(document, { validate: { errors: { colorize: false } } })
  return result.valid ? { valid: true } : { valid: false, errors: result.errors.map(({ message }) => ({ message })), additionalErrors: result.additionalErrors }
}

// Started by `validateDocumentInWorker`. `workerData` is a structured clone, so `validate` can dereference it in place.
try {
  parentPort?.postMessage((await run(workerData as Document)) satisfies WorkerResult)
} catch (error) {
  parentPort?.postMessage({ thrown: error instanceof Error ? error.message : String(error) } satisfies WorkerResult)
}
