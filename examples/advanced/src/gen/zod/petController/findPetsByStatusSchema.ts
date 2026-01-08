import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  FindPetsByStatusPathParams,
  FindPetsByStatusResponseData,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus400,
} from '../../models/ts/petController/FindPetsByStatus.ts'
import { petSchema } from '../petSchema.ts'

export const findPetsByStatusPathParamsSchema = z.object({
  step_id: z.string(),
}) as unknown as ToZod<FindPetsByStatusPathParams>

export type FindPetsByStatusPathParamsSchema = FindPetsByStatusPathParams

/**
 * @description successful operation
 */
export const findPetsByStatusStatus200Schema = z
  .array(z.lazy(() => petSchema))
  .min(1)
  .max(3)
  .refine((items) => new Set(items).size === items.length, { message: 'Array entries must be unique' }) as unknown as ToZod<FindPetsByStatusStatus200>

export type FindPetsByStatusStatus200Schema = FindPetsByStatusStatus200

/**
 * @description Invalid status value
 */
export const findPetsByStatusStatus400Schema = z.any() as unknown as ToZod<FindPetsByStatusStatus400>

export type FindPetsByStatusStatus400Schema = FindPetsByStatusStatus400

export const findPetsByStatusResponseDataSchema = z.lazy(() => findPetsByStatusStatus200Schema) as unknown as ToZod<FindPetsByStatusResponseData>

export type FindPetsByStatusResponseDataSchema = FindPetsByStatusResponseData
