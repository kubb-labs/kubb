import { z } from 'zod'

import { apiResponseSchema } from '../apiResponseSchema'

export const uploadFileMutationRequestSchema = z.string()
export const uploadFilePathParamsSchema = z.object({ petId: z.number().describe(`ID of pet to update`) })
export const uploadfileQueryparamsSchema = z.object({ additionalMetadata: z.string().describe(`Additional Metadata`).optional() })

/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema)
