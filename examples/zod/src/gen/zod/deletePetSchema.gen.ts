import { z } from '../../zod.ts'

export const deletePetPathParamsSchema = z.object({ petId: z.coerce.number().describe('Pet id to delete') })

export const deletePetHeaderParamsSchema = z.object({ api_key: z.coerce.string().optional() }).optional()
/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any()

export const deletePetMutationResponseSchema = z.any()
