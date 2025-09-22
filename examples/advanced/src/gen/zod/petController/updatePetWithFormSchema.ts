import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
} from '../../models/ts/petController/UpdatePetWithForm.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const updatePetWithFormPathParamsSchema = z.object({
  petId: z.coerce.number().int().describe('ID of pet that needs to be updated'),
}) as unknown as ToZod<UpdatePetWithFormPathParams>

export type UpdatePetWithFormPathParamsSchema = UpdatePetWithFormPathParams

export const updatePetWithFormQueryParamsSchema = z
  .object({
    name: z.optional(z.string().describe('Name of pet that needs to be updated')),
    status: z.optional(z.string().describe('Status of pet that needs to be updated')),
  })
  .optional() as unknown as ToZod<UpdatePetWithFormQueryParams>

export type UpdatePetWithFormQueryParamsSchema = UpdatePetWithFormQueryParams

/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any() as unknown as ToZod<UpdatePetWithForm405>

export type UpdatePetWithForm405Schema = UpdatePetWithForm405

export const updatePetWithFormMutationResponseSchema = z.any() as unknown as ToZod<UpdatePetWithFormMutationResponse>

export type UpdatePetWithFormMutationResponseSchema = UpdatePetWithFormMutationResponse
