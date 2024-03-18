import { z } from 'zod'
import { apiResponseSchema } from './apiResponseSchema'

export const uploadFileMutationRequestSchema = z.string()
export const uploadFilePathParamsSchema = z.object({ petId: z.number().describe('ID of pet to update') })
export const uploadFileQueryParamsSchema = z.object({ additionalMetadata: z.string().describe('Additional Metadata').optional() }).optional()

/**
 * @description successful operation
 */
export const uploadFile200Schema = z.lazy(() => apiResponseSchema)

/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema)
