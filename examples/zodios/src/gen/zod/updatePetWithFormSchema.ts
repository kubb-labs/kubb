import z from 'zod'

export const updatePetWithFormPathParamsSchema = z.object({ petId: z.number() })
export const updatePetWithFormQueryParamsSchema = z.object({ name: z.string().optional(), status: z.string().optional() })
export const updatePetWithFormRequestSchema = z.any()
export const updatePetWithFormResponseSchema = z.any()

/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any()
