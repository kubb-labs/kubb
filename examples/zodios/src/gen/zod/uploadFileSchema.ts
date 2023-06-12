import { z } from 'zod'

import { apiResponseSchema } from './apiResponseSchema'

export const uploadFileMutationRequestSchema = z.string()
export const uploadFilePathParamsSchema = z.object({ petId: z.number() })
export const uploadFileQueryParamsSchema = z.object({ additionalMetadata: z.string().optional() })

/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema)
