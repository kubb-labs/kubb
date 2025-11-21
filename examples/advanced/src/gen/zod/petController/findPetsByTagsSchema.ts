import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  FindPetsByTags200,
  FindPetsByTags400,
  FindPetsByTagsHeaderParams,
  FindPetsByTagsQueryParams,
  FindPetsByTagsQueryResponse,
} from '../../models/ts/petController/FindPetsByTags.ts'
import { petSchema } from '../petSchema.ts'

export const findPetsByTagsQueryParamsSchema = z
  .object({
    tags: z.optional(z.array(z.string()).describe('Tags to filter by')),
    page: z.optional(z.string().describe('to request with required page number or pagination')),
    pageSize: z.optional(z.coerce.number().describe('to request with required page size')),
  })
  .optional() as unknown as ToZod<FindPetsByTagsQueryParams>

export type FindPetsByTagsQueryParamsSchema = FindPetsByTagsQueryParams

export const findPetsByTagsHeaderParamsSchema = z.object({
  'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters'),
}) as unknown as ToZod<FindPetsByTagsHeaderParams>

export type FindPetsByTagsHeaderParamsSchema = FindPetsByTagsHeaderParams

/**
 * @description successful operation
 */
export const findPetsByTags200Schema = z.array(petSchema) as unknown as ToZod<FindPetsByTags200>

export type FindPetsByTags200Schema = FindPetsByTags200

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any() as unknown as ToZod<FindPetsByTags400>

export type FindPetsByTags400Schema = FindPetsByTags400

export const findPetsByTagsQueryResponseSchema = findPetsByTags200Schema as unknown as ToZod<FindPetsByTagsQueryResponse>

export type FindPetsByTagsQueryResponseSchema = FindPetsByTagsQueryResponse
