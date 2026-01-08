import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithFormResponseData,
  UpdatePetWithFormStatus405,
} from '../../models/ts/petController/UpdatePetWithForm.ts'

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
export const updatePetWithFormStatus405Schema = z.any() as unknown as ToZod<UpdatePetWithFormStatus405>

export type UpdatePetWithFormStatus405Schema = UpdatePetWithFormStatus405

export const updatePetWithFormResponseDataSchema = z.any() as unknown as ToZod<UpdatePetWithFormResponseData>

export type UpdatePetWithFormResponseDataSchema = UpdatePetWithFormResponseData
