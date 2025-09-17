import type { DeletePetPathParams, DeletePetHeaderParams, DeletePet400, DeletePetMutationResponse } from '../../models/ts/petController/DeletePet.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const deletePetPathParamsSchema = z.object({
  petId: z.coerce.number().int().describe('Pet id to delete'),
}) as unknown as ToZod<DeletePetPathParams>

export type DeletePetPathParamsSchema = DeletePetPathParams

export const deletePetHeaderParamsSchema = z
  .object({
    api_key: z.string().optional(),
  })
  .optional() as unknown as ToZod<DeletePetHeaderParams>

export type DeletePetHeaderParamsSchema = DeletePetHeaderParams

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any() as unknown as ToZod<DeletePet400>

export type DeletePet400Schema = DeletePet400

export const deletePetMutationResponseSchema = z.any() as unknown as ToZod<DeletePetMutationResponse>

export type DeletePetMutationResponseSchema = DeletePetMutationResponse
