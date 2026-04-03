import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const addFiles200Schema = petSchema.omit({ name: true }).describe('successful operation')

export type AddFiles200Schema = z.infer<typeof addFiles200Schema>

export const addFiles405Schema = z.any().describe('Invalid input')

export type AddFiles405Schema = z.infer<typeof addFiles405Schema>

export const addFilesMutationRequestSchema = petSchema.omit({ id: true })

export type AddFilesMutationRequestSchema = z.infer<typeof addFilesMutationRequestSchema>

export const addFilesMutationResponseSchema = addFiles200Schema

export type AddFilesMutationResponseSchema = z.infer<typeof addFilesMutationResponseSchema>

export const addFilesMutationSchema = z.object({
  Response: addFiles200Schema,
  Request: addFilesMutationRequestSchema,
  Errors: addFiles405Schema,
})

export type AddFilesMutationSchema = z.infer<typeof addFilesMutationSchema>
