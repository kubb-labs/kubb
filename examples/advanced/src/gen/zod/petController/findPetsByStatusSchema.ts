import type {
  FindPetsByStatusPathParams,
  FindPetsByStatus200,
  FindPetsByStatus400,
  FindPetsByStatusQueryResponse,
} from '../../models/ts/petController/FindPetsByStatus.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod/v4'

export const findPetsByStatusPathParamsSchema = z.object({
  step_id: z.string(),
}) as unknown as ToZod<FindPetsByStatusPathParams>

export type FindPetsByStatusPathParamsSchema = FindPetsByStatusPathParams

/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z
  .array(petSchema)
  .min(1)
  .max(3)
  .refine((items) => new Set(items).size === items.length, { message: 'Array entries must be unique' }) as unknown as ToZod<FindPetsByStatus200>

export type FindPetsByStatus200Schema = FindPetsByStatus200

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any() as unknown as ToZod<FindPetsByStatus400>

export type FindPetsByStatus400Schema = FindPetsByStatus400

export const findPetsByStatusQueryResponseSchema = findPetsByStatus200Schema as unknown as ToZod<FindPetsByStatusQueryResponse>

export type FindPetsByStatusQueryResponseSchema = FindPetsByStatusQueryResponse
