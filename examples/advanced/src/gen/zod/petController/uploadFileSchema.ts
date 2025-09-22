import { apiResponseSchema } from '../apiResponseSchema.ts'
import { z } from 'zod/v4'

export const uploadFilePathParamsSchema = z.object({
  petId: z.coerce.number().int().describe('ID of pet to update'),
})

export type UploadFilePathParamsSchema = z.infer<typeof uploadFilePathParamsSchema>

export const uploadFileQueryParamsSchema = z
  .object({
    additionalMetadata: z.optional(z.string().describe('Additional Metadata')),
  })
  .optional()

export type UploadFileQueryParamsSchema = z.infer<typeof uploadFileQueryParamsSchema>

/**
 * @description successful operation
 */
export const uploadFile200Schema = apiResponseSchema

export type UploadFile200Schema = z.infer<typeof uploadFile200Schema>

export const uploadFileMutationRequestSchema = z.instanceof(File)

export type UploadFileMutationRequestSchema = z.infer<typeof uploadFileMutationRequestSchema>

export const uploadFileMutationResponseSchema = uploadFile200Schema

export type UploadFileMutationResponseSchema = z.infer<typeof uploadFileMutationResponseSchema>
