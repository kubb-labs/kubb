import type {
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePets201,
  CreatePetsError,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
} from '../../models/ts/petsController/CreatePets.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { petNotFoundSchema } from '../petNotFoundSchema.ts'
import { z } from 'zod/v4'

export const createPetsPathParamsSchema = z.object({
  uuid: z.string().describe('UUID'),
}) as unknown as ToZod<CreatePetsPathParams>

export type CreatePetsPathParamsSchema = CreatePetsPathParams

export const createPetsQueryParamsSchema = z
  .object({
    bool_param: z.optional(z.literal(true)),
    offset: z.optional(z.coerce.number().int().describe('Offset */')),
  })
  .optional() as unknown as ToZod<CreatePetsQueryParams>

export type CreatePetsQueryParamsSchema = CreatePetsQueryParams

export const createPetsHeaderParamsSchema = z.object({
  'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters'),
}) as unknown as ToZod<CreatePetsHeaderParams>

export type CreatePetsHeaderParamsSchema = CreatePetsHeaderParams

/**
 * @description Null response
 */
export const createPets201Schema = z.any() as unknown as ToZod<CreatePets201>

export type CreatePets201Schema = CreatePets201

/**
 * @description unexpected error
 */
export const createPetsErrorSchema = petNotFoundSchema.describe('Pet not found') as unknown as ToZod<CreatePetsError>

export type CreatePetsErrorSchema = CreatePetsError

export const createPetsMutationRequestSchema = z.object({
  name: z.string(),
  tag: z.string(),
}) as unknown as ToZod<CreatePetsMutationRequest>

export type CreatePetsMutationRequestSchema = CreatePetsMutationRequest

export const createPetsMutationResponseSchema = createPets201Schema as unknown as ToZod<CreatePetsMutationResponse>

export type CreatePetsMutationResponseSchema = CreatePetsMutationResponse
