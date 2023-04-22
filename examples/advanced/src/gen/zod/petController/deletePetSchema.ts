import z from 'zod'

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any()
export const deletePetPathParamsSchema = z.object({ petId: z.number() })
export const deletePetResponseSchema = z.any()
