import { z } from 'zod/v4'

export const deletePetPathParamsSchema = z.object({
  petId: z.coerce.number().int().describe('Pet id to delete'),
})

export type DeletePetPathParamsSchema = z.infer<typeof deletePetPathParamsSchema>

export const deletePetHeaderParamsSchema = z
  .object({
    api_key: z.string().optional(),
  })
  .optional()

export type DeletePetHeaderParamsSchema = z.infer<typeof deletePetHeaderParamsSchema>

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.unknown()

export type DeletePet400Schema = z.infer<typeof deletePet400Schema>

export const deletePetMutationResponseSchema = z.undefined()

export type DeletePetMutationResponseSchema = z.infer<typeof deletePetMutationResponseSchema>
