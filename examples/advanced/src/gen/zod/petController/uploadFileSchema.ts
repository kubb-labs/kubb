import { z } from 'zod'
import { apiResponseSchema } from '../apiResponseSchema'

/**
 * @description successful operation
 */
export const uploadFile200Schema = z.lazy(() => apiResponseSchema)

export const uploadFileMutationRequestSchema = z.string()

/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema)

export const uploadFilePathParamsSchema = z.object({ 'petId': z.number().describe('ID of pet to update') })

export const uploadFileQueryParamsSchema = z.object({ 'additionalMetadata': z.string().describe('Additional Metadata').optional() }).optional()
