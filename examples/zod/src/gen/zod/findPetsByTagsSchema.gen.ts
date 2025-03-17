import type {
  FindPetsByTagsQueryParamsType,
  FindPetsByTagsHeaderParamsType,
  FindPetsByTags200Type,
  FindPetsByTags400Type,
  FindPetsByTagsQueryResponseType,
} from '../ts/FindPetsByTagsType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen.ts'

export const findPetsByTagsQueryParamsSchema = z
  .object({
    tags: z.array(z.string()).describe('Tags to filter by').optional(),
    page: z.string().describe('to request with required page number or pagination').optional(),
    pageSize: z.string().describe('to request with required page size').optional(),
  })
  .optional() as unknown as ToZod<FindPetsByTagsQueryParamsType>

export type FindPetsByTagsQueryParamsSchema = FindPetsByTagsQueryParamsType

export const findPetsByTagsHeaderParamsSchema = z.object({
  'X-EXAMPLE': z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters'),
}) as unknown as ToZod<FindPetsByTagsHeaderParamsType>

export type FindPetsByTagsHeaderParamsSchema = FindPetsByTagsHeaderParamsType

/**
 * @description successful operation
 */
export const findPetsByTags200Schema = z.array(z.lazy(() => petSchema)) as unknown as ToZod<FindPetsByTags200Type>

export type FindPetsByTags200Schema = FindPetsByTags200Type

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any() as unknown as ToZod<FindPetsByTags400Type>

export type FindPetsByTags400Schema = FindPetsByTags400Type

export const findPetsByTagsQueryResponseSchema = z.lazy(() => findPetsByTags200Schema) as unknown as ToZod<FindPetsByTagsQueryResponseType>

export type FindPetsByTagsQueryResponseSchema = FindPetsByTagsQueryResponseType
