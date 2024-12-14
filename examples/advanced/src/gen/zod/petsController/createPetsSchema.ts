import type {
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePets201,
  CreatePetsError,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
} from '../../models/ts/petsController/CreatePets.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { petNotFoundSchema } from '../petNotFoundSchema.ts'
import { z } from 'zod'

export const createPetsPathParamsSchema = z.object({
  uuid: z.string().describe('UUID'),
} satisfies ToZod<CreatePetsPathParams>)

export type CreatePetsPathParamsSchema = CreatePetsPathParams

export const createPetsQueryParamsSchema = z
  .object({
    offset: z.number().int().describe('Offset */').optional(),
  } satisfies ToZod<CreatePetsQueryParams>)
  .optional()

export type CreatePetsQueryParamsSchema = CreatePetsQueryParams

export const createPetsHeaderParamsSchema = z.object({
  'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters'),
} satisfies ToZod<CreatePetsHeaderParams>)

export type CreatePetsHeaderParamsSchema = CreatePetsHeaderParams

/**
 * @description Null response
 */
export const createPets201Schema = z.any()

export type CreatePets201Schema = CreatePets201

/**
 * @description unexpected error
 */
export const createPetsErrorSchema = z.lazy(() => petNotFoundSchema)

export type CreatePetsErrorSchema = CreatePetsError

export const createPetsMutationRequestSchema = z.object({
  name: z.string(),
  tag: z.string(),
} satisfies ToZod<CreatePetsMutationRequest>)

export type CreatePetsMutationRequestSchema = CreatePetsMutationRequest

export const createPetsMutationResponseSchema = z.lazy(() => createPets201Schema)

export type CreatePetsMutationResponseSchema = CreatePetsMutationResponse
