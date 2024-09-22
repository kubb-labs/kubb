import { z } from '../../zod.ts'
import { apiResponseSchema } from './apiResponseSchema.gen'

export const uploadFilePathParamsSchema = z.object({ petId: z.number().int().describe('ID of pet to update') })
export type UploadFilePathParamsSchema = z.infer<typeof uploadFilePathParamsSchema>

export const uploadFileQueryParamsSchema = z.object({ additionalMetadata: z.string().describe('Additional Metadata').optional() }).optional()
export type UploadFileQueryParamsSchema = z.infer<typeof uploadFileQueryParamsSchema>
/**
 * @description successful operation
 */
export const uploadFile200Schema = z.lazy(() => apiResponseSchema)
export type UploadFile200Schema = z.infer<typeof uploadFile200Schema>

export const uploadFileMutationRequestSchema = z.string()
export type UploadFileMutationRequestSchema = z.infer<typeof uploadFileMutationRequestSchema>
/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema)
export type UploadFileMutationResponseSchema = z.infer<typeof uploadFileMutationResponseSchema>
