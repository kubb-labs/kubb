import { z } from 'zod'

export const uploadFileMutationRequestSchema = z.string()

/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.any()
export const uploadFilePathParamsSchema = z.object({ petId: z.number().describe(`ID of pet to update`) })
export const uploadFileQueryParamsSchema = z.object({ additionalMetadata: z.string().describe(`Additional Metadata`).optional() }).optional()
