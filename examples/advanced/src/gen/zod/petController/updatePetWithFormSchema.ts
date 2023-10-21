import { z } from 'zod'

/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any()
export const updatePetWithFormMutationResponseSchema = z.any()
export const updatePetWithFormPathParamsSchema = z.object({ 'petId': z.number().describe(`ID of pet that needs to be updated`) })
export const updatePetWithFormQueryParamsSchema = z.object({
  'name': z.string().describe(`Name of pet that needs to be updated`).optional(),
  'status': z.string().describe(`Status of pet that needs to be updated`).optional(),
})
