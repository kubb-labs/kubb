import { z } from '../../zod.ts'

export const updatePetWithFormPathParamsSchema = z.object({ petId: z.number().int().describe('ID of pet that needs to be updated') })

export type UpdatePetWithFormPathParamsSchema = z.infer<typeof updatePetWithFormPathParamsSchema>

export const updatePetWithFormQueryParamsSchema = z
  .object({
    name: z.string().describe('Name of pet that needs to be updated').optional(),
    status: z.string().describe('Status of pet that needs to be updated').optional(),
  })
  .optional()

export type UpdatePetWithFormQueryParamsSchema = z.infer<typeof updatePetWithFormQueryParamsSchema>

/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any()

export type UpdatePetWithForm405Schema = z.infer<typeof updatePetWithForm405Schema>

export const updatePetWithFormMutationResponseSchema = z.any()

export type UpdatePetWithFormMutationResponseSchema = z.infer<typeof updatePetWithFormMutationResponseSchema>
