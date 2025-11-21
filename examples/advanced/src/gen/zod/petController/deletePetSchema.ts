import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../models/ts/petController/DeletePet.ts'

export const deletePetPathParamsSchema = z.object({
  petId: z.coerce.number().int().describe('Pet id to delete'),
}) as unknown as ToZod<DeletePetPathParams>

export type DeletePetPathParamsSchema = DeletePetPathParams

export const deletePetHeaderParamsSchema = z
  .object({
    api_key: z.optional(z.string()),
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
