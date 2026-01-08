import type {
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus400,
  FindPetsByTagsResponseData,
} from '../../models/ts/petController/FindPetsByTags.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

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
export const findPetsByTagsStatus200Schema = z.array(z.lazy(() => petSchema)) as unknown as ToZod<FindPetsByTagsStatus200>

export type FindPetsByTagsStatus200Schema = FindPetsByTagsStatus200

/**
 * @description Invalid tag value
 */
export const findPetsByTagsStatus400Schema = z.any() as unknown as ToZod<FindPetsByTagsStatus400>

export type FindPetsByTagsStatus400Schema = FindPetsByTagsStatus400

export const findPetsByTagsResponseDataSchema = z.lazy(() => findPetsByTagsStatus200Schema) as unknown as ToZod<FindPetsByTagsResponseData>

export type FindPetsByTagsResponseDataSchema = FindPetsByTagsResponseData
