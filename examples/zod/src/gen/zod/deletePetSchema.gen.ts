import type { DeletePetPathParamsType, DeletePetHeaderParamsType, DeletePet400Type, DeletePetMutationResponseType } from '../ts/DeletePetType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const deletePetPathParamsSchema = z.object({
  petId: z.number().int().describe('Pet id to delete'),
}) as unknown as ToZod<DeletePetPathParamsType>

export type DeletePetPathParamsSchema = DeletePetPathParamsType

export const deletePetHeaderParamsSchema = z
  .object({
    api_key: z.string().optional(),
  })
  .optional() as unknown as ToZod<DeletePetHeaderParamsType>

export type DeletePetHeaderParamsSchema = DeletePetHeaderParamsType

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any() as unknown as ToZod<DeletePet400Type>

export type DeletePet400Schema = DeletePet400Type

export const deletePetMutationResponseSchema = z.any() as unknown as ToZod<DeletePetMutationResponseType>

export type DeletePetMutationResponseSchema = DeletePetMutationResponseType