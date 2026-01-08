import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  CreatePetsHeaderParams,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsRequestData,
  CreatePetsResponseData,
  CreatePetsStatus201,
  CreatePetsStatusError,
} from '../../models/ts/petsController/CreatePets.ts'
import { petNotFoundSchema } from '../petNotFoundSchema.ts'

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
export const createPetsStatus201Schema = z.any() as unknown as ToZod<CreatePetsStatus201>

export type CreatePetsStatus201Schema = CreatePetsStatus201

/**
 * @description unexpected error
 */
export const createPetsStatusErrorSchema = z.lazy(() => petNotFoundSchema).describe('Pet not found') as unknown as ToZod<CreatePetsStatusError>

export type CreatePetsStatusErrorSchema = CreatePetsStatusError

export const createPetsRequestDataSchema = z.object({
  name: z.string(),
  tag: z.string(),
}) as unknown as ToZod<CreatePetsRequestData>

export type CreatePetsRequestDataSchema = CreatePetsRequestData

export const createPetsResponseDataSchema = z.lazy(() => createPetsStatus201Schema) as unknown as ToZod<CreatePetsResponseData>

export type CreatePetsResponseDataSchema = CreatePetsResponseData
