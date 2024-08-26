import { z } from 'zod'

export const deletePetPathParamsSchema = z.object({ petId: z.number().describe('Pet id to delete') })

export const deletePetHeaderParamsSchema = z.object({ api_key: z.string().optional() }).optional()

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any()

export const deletePetMutationResponseSchema = z.any()
