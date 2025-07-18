import { petNotFoundSchema } from '../petNotFoundSchema.ts'
import { z } from 'zod/v4'

export const createPetsPathParamsSchema = z.object({
  uuid: z.string().describe('UUID'),
})

export type CreatePetsPathParamsSchema = z.infer<typeof createPetsPathParamsSchema>

export const createPetsQueryParamsSchema = z
  .object({
    bool_param: z.literal(true).optional(),
    offset: z.coerce.number().int().describe('Offset */').optional(),
  })
  .optional()

export type CreatePetsQueryParamsSchema = z.infer<typeof createPetsQueryParamsSchema>

export const createPetsHeaderParamsSchema = z.object({
  'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters'),
})

export type CreatePetsHeaderParamsSchema = z.infer<typeof createPetsHeaderParamsSchema>

/**
 * @description Null response
 */
export const createPets201Schema = z.any()

export type CreatePets201Schema = z.infer<typeof createPets201Schema>

/**
 * @description unexpected error
 */
export const createPetsErrorSchema = petNotFoundSchema.describe('Pet not found')

export type CreatePetsErrorSchema = z.infer<typeof createPetsErrorSchema>

export const createPetsMutationRequestSchema = z.object({
  name: z.string(),
  tag: z.string(),
})

export type CreatePetsMutationRequestSchema = z.infer<typeof createPetsMutationRequestSchema>

export const createPetsMutationResponseSchema = createPets201Schema

export type CreatePetsMutationResponseSchema = z.infer<typeof createPetsMutationResponseSchema>
