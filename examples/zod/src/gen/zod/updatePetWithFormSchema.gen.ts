import type {
  UpdatePetWithFormPathParamsType,
  UpdatePetWithFormQueryParamsType,
  UpdatePetWithForm405Type,
  UpdatePetWithFormMutationResponseType,
} from '../ts/UpdatePetWithFormType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const updatePetWithFormPathParamsSchema = z.object({
  petId: z.number().int().describe('ID of pet that needs to be updated'),
}) as unknown as ToZod<UpdatePetWithFormPathParamsType>

export type UpdatePetWithFormPathParamsSchema = UpdatePetWithFormPathParamsType

export const updatePetWithFormQueryParamsSchema = z
  .object({
    name: z.string().describe('Name of pet that needs to be updated').optional(),
    status: z.string().describe('Status of pet that needs to be updated').optional(),
  })
  .optional() as unknown as ToZod<UpdatePetWithFormQueryParamsType>

export type UpdatePetWithFormQueryParamsSchema = UpdatePetWithFormQueryParamsType

/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any() as unknown as ToZod<UpdatePetWithForm405Type>

export type UpdatePetWithForm405Schema = UpdatePetWithForm405Type

export const updatePetWithFormMutationResponseSchema = z.any() as unknown as ToZod<UpdatePetWithFormMutationResponseType>

export type UpdatePetWithFormMutationResponseSchema = UpdatePetWithFormMutationResponseType
