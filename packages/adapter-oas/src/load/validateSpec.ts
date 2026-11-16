import { validate } from '@readme/openapi-parser'
import type { Document } from '../types.ts'

export type ValidationErrors = { errors: Array<{ message: string }>; additionalErrors: number }

export type WorkerResult = { valid: true } | ({ valid: false } & ValidationErrors) | { thrown: string }

/** Checks `document` with `@readme/openapi-parser`. It dereferences `document` in place, so pass a copy. */
export async function validateSpec(document: Document): Promise<WorkerResult> {
  try {
    const result = await validate(document, { validate: { errors: { colorize: false } } })
    return result.valid
      ? { valid: true }
      : { valid: false, errors: result.errors.map(({ message }) => ({ message })), additionalErrors: result.additionalErrors }
  } catch (error) {
    // No `@internals/utils` here: the worker runs this file without the workspace build.
    return { thrown: error instanceof Error ? error.message : String(error) }
  }
}
