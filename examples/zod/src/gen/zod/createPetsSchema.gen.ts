import type {
  CreatePetsPathParamsType,
  CreatePetsQueryParamsType,
  CreatePetsHeaderParamsType,
  CreatePets201Type,
  CreatePetsErrorType,
  CreatePetsMutationRequestType,
  CreatePetsMutationResponseType,
} from '../ts/CreatePetsType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { petNotFoundSchema } from './petNotFoundSchema.gen.ts'

export const createPetsPathParamsSchema = z.object({
  uuid: z.string().describe('UUID'),
}) as unknown as ToZod<CreatePetsPathParamsType>

export type CreatePetsPathParamsSchema = CreatePetsPathParamsType

export const createPetsQueryParamsSchema = z
  .object({
    offset: z.number().int().describe('Offset').optional(),
  })
  .optional() as unknown as ToZod<CreatePetsQueryParamsType>

export type CreatePetsQueryParamsSchema = CreatePetsQueryParamsType

export const createPetsHeaderParamsSchema = z.object({
  'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters'),
}) as unknown as ToZod<CreatePetsHeaderParamsType>

export type CreatePetsHeaderParamsSchema = CreatePetsHeaderParamsType

/**
 * @description Null response
 */
export const createPets201Schema = z.any() as unknown as ToZod<CreatePets201Type>

export type CreatePets201Schema = CreatePets201Type

/**
 * @description unexpected error
 */
export const createPetsErrorSchema = z.lazy(() => petNotFoundSchema) as unknown as ToZod<CreatePetsErrorType>

export type CreatePetsErrorSchema = CreatePetsErrorType

export const createPetsMutationRequestSchema = z.object({
  name: z.string(),
  tag: z.string(),
}) as unknown as ToZod<CreatePetsMutationRequestType>

export type CreatePetsMutationRequestSchema = CreatePetsMutationRequestType

export const createPetsMutationResponseSchema = z.lazy(() => createPets201Schema) as unknown as ToZod<CreatePetsMutationResponseType>

export type CreatePetsMutationResponseSchema = CreatePetsMutationResponseType
