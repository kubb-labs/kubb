import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
} from '../../models/ts/petController/UpdatePetWithForm.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const updatePetWithFormPathParamsSchema = z.object({
  petId: z.number().int().describe('ID of pet that needs to be updated'),
} satisfies ToZod<UpdatePetWithFormPathParams>)

export type UpdatePetWithFormPathParamsSchema = UpdatePetWithFormPathParams

export const updatePetWithFormQueryParamsSchema = z
  .object({
    name: z.string().describe('Name of pet that needs to be updated').optional(),
    status: z.string().describe('Status of pet that needs to be updated').optional(),
  } satisfies ToZod<UpdatePetWithFormQueryParams>)
  .optional()

export type UpdatePetWithFormQueryParamsSchema = UpdatePetWithFormQueryParams

/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any()

export type UpdatePetWithForm405Schema = UpdatePetWithForm405

export const updatePetWithFormMutationResponseSchema = z.any()

export type UpdatePetWithFormMutationResponseSchema = UpdatePetWithFormMutationResponse
