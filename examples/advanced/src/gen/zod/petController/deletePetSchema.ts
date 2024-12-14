import type { DeletePetPathParams, DeletePetHeaderParams, DeletePet400, DeletePetMutationResponse } from '../../models/ts/petController/DeletePet.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const deletePetPathParamsSchema = z.object({
  petId: z.number().int().describe('Pet id to delete'),
} satisfies ToZod<DeletePetPathParams>)

export type DeletePetPathParamsSchema = DeletePetPathParams

export const deletePetHeaderParamsSchema = z
  .object({
    api_key: z.string().optional(),
  } satisfies ToZod<DeletePetHeaderParams>)
  .optional()

export type DeletePetHeaderParamsSchema = DeletePetHeaderParams

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any()

export type DeletePet400Schema = DeletePet400

export const deletePetMutationResponseSchema = z.any()

export type DeletePetMutationResponseSchema = DeletePetMutationResponse
