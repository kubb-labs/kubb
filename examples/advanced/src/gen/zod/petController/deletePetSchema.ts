import { z } from 'zod'

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any()
export const deletePetHeaderParamsSchema = z.object({ 'api_key': z.string().optional() })
export const deletePetMutationResponseSchema = z.any()
export const deletePetPathParamsSchema = z.object({ 'petId': z.number().describe(`Pet id to delete`) })
