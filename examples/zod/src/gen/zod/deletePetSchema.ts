import z from 'zod'

export const deletePetPathParamsSchema = z.object({ petId: z.number() })
export const deletePetRequestSchema = z.any()
export const deletePetResponseSchema = z.any()

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any()
