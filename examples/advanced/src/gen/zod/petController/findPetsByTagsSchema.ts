import type {
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags200,
  FindPetsByTags400,
  FindPetsByTagsQueryResponse,
} from '../../models/ts/petController/FindPetsByTags.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

export const findPetsByTagsQueryParamsSchema = z
  .object({
    tags: z.array(z.string()).describe('Tags to filter by').optional(),
    page: z.string().describe('to request with required page number or pagination').optional(),
    pageSize: z.string().describe('to request with required page size').optional(),
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
export const findPetsByTags200Schema = z.array(z.lazy(() => petSchema)) as unknown as ToZod<FindPetsByTags200>

export type FindPetsByTags200Schema = FindPetsByTags200

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any() as unknown as ToZod<FindPetsByTags400>

export type FindPetsByTags400Schema = FindPetsByTags400

export const findPetsByTagsQueryResponseSchema = z.lazy(() => findPetsByTags200Schema) as unknown as ToZod<FindPetsByTagsQueryResponse>

export type FindPetsByTagsQueryResponseSchema = FindPetsByTagsQueryResponse
