import z from 'zod'

import { apiResponseSchema } from '../apiResponseSchema'

export const uploadFilePathParamsSchema = z.object({ petId: z.number() })
export const uploadFileQueryParamsSchema = z.object({ additionalMetadata: z.string().optional() })
export const uploadFileRequestSchema = z.any()

/**
 * @description successful operation
 */
export const uploadFileResponseSchema = z.lazy(() => apiResponseSchema)
