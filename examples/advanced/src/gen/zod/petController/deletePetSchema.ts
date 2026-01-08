import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { DeletePetHeaderParams, DeletePetPathParams, DeletePetResponseData, DeletePetStatus400 } from '../../models/ts/petController/DeletePet.ts'

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
export const deletePetStatus400Schema = z.any() as unknown as ToZod<DeletePetStatus400>

export type DeletePetStatus400Schema = DeletePetStatus400

export const deletePetResponseDataSchema = z.any() as unknown as ToZod<DeletePetResponseData>

export type DeletePetResponseDataSchema = DeletePetResponseData
