import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const addFiles200Schema = z.lazy(() => petSchema).schema.omit({ name: true })

export type AddFiles200Schema = z.infer<typeof addFiles200Schema>

/**
 * @description Invalid input
 */
export const addFiles405Schema = z.any()

export type AddFiles405Schema = z.infer<typeof addFiles405Schema>

export const addFilesMutationRequestSchema = z.lazy(() => petSchema).schema.omit({ id: true })

export type AddFilesMutationRequestSchema = z.infer<typeof addFilesMutationRequestSchema>

export const addFilesMutationResponseSchema = z.lazy(() => addFiles200Schema)

export type AddFilesMutationResponseSchema = z.infer<typeof addFilesMutationResponseSchema>
